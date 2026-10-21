import { Logger } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage,
  WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { FirebaseService } from '../../firebase/firebase.service';

const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
const VALID_ID = /^[A-Za-z0-9_-]{1,256}$/;

@WebSocketGateway({ cors: { origin: allowedOrigins, credentials: true } })
export class ChatRoomGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server;
  private readonly logger = new Logger(ChatRoomGateway.name);

  constructor(private readonly firebase: FirebaseService) {}

  // Browser: io(API_URL, { auth: { token: await firebaseUser.getIdToken() } })
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token) throw new Error('Missing token');
      const verified = await this.firebase.auth.verifyIdToken(token);
      client.data.uid = verified.uid;
    } catch {
      client.disconnect(true);
    }
  }

  private key(connectionId: string, sessionId: string, roomId: string) {
    return `chat:${connectionId}:${sessionId}:${roomId}`;
  }

  @SubscribeMessage('chat:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { connectionId?: string; roomId?: string },
  ) {
    const uid = client.data.uid;
    const id = body?.connectionId;
    const roomId = body?.roomId;
    if (!uid || typeof id !== 'string' || typeof roomId !== 'string' ||
        !VALID_ID.test(id) || !VALID_ID.test(roomId)) {
      return { ok: false, error: 'Invalid room' };
    }
    const connectionRef = this.firebase.firestore.collection('connections').doc(id);
    const connectionDoc = await connectionRef.get();
    const connection = connectionDoc.data();
    if (connection?.status !== 'CONNECTED' ||
        !Array.isArray(connection.participants) ||
        !connection.participants.includes(uid) ||
        connection.activeRoomId !== roomId ||
        typeof connection.activeSessionId !== 'string' ||
        !VALID_ID.test(connection.activeSessionId)) {
      return { ok: false, error: 'Room not available' };
    }
    const sessionRef = connectionRef.collection('sessions').doc(connection.activeSessionId);
    const roomRef = sessionRef.collection('rooms').doc(roomId);
    const [sessionDoc, roomDoc] = await Promise.all([sessionRef.get(), roomRef.get()]);
    if (!sessionDoc.exists || !roomDoc.exists ||
        sessionDoc.data()?.status === 'CLOSED' ||
        ['CLOSED', 'REPLACED'].includes(roomDoc.data()?.status)) {
      return { ok: false, error: 'Room not available' };
    }
    // Leave other chat rooms for the *same connection*: protects against
    // accidentally staying subscribed after a thought switch.
    for (const existing of client.rooms) {
      if (existing.startsWith(`chat:${id}:`)) await client.leave(existing);
    }
    await client.join(this.key(id, connection.activeSessionId, roomId));
    // Recheck after join: room could switch while async permission reads run.
    const fresh = (await connectionRef.get()).data();
    if (fresh?.status !== 'CONNECTED' || fresh.activeRoomId !== roomId ||
        fresh.activeSessionId !== connection.activeSessionId) {
      await client.leave(this.key(id, connection.activeSessionId, roomId));
      return { ok: false, error: 'Room changed; refresh' };
    }
    return { ok: true, roomId };
  }

  emitToRoom(
    connectionId: string, sessionId: string, roomId: string,
    event: string, data: Record<string, unknown>,
  ): void {
    try {
      this.server.to(this.key(connectionId, sessionId, roomId)).emit(event, {
        connectionId, roomId, ...data,
      });
    } catch (error) {
      // A post-commit transport failure must not turn a successful REST write
      // into a 500 (which would induce unnecessary retries).
      this.logger.warn(`Could not broadcast ${event}: ${String(error)}`);
    }
  }
}
