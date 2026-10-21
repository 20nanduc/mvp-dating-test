import {
  BadRequestException, ConflictException, ForbiddenException, Injectable,
  Logger, NotFoundException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { FirebaseService } from '../../firebase/firebase.service';
import { ChatRoomGateway } from './chat-room.gateway';

const DEFAULT_THOUGHT = "Let's get to know each other";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

type ChatMessageType = 'TEXT' | 'THOUGHT_PROPOSAL' | 'THOUGHT_START';
type ChatData = Record<string, any>;

function requireId(id: string): string {
  if (!ID_PATTERN.test(id)) throw new BadRequestException('Invalid ID');
  return id;
}

function iso(value: any): string {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(0).toISOString();
}

function cleanedText(raw: string, max: number): string {
  const text = raw.trim();
  if (text.length === 0 || text.length > max) {
    throw new BadRequestException(`Text must be 1–${max} characters`);
  }
  return text;
}

function toMessage(id: string, data: ChatData) {
  return {
    id,
    type: data.type as ChatMessageType,
    content: data.content as string,
    senderId: (data.senderId ?? null) as string | null,
    createdAt: iso(data.createdAt),
    ...(data.type === 'THOUGHT_PROPOSAL'
      ? { proposalStatus: data.proposalStatus ?? 'PENDING' }
      : {}),
  };
}

@Injectable()
export class ChatRoomService {
  private readonly logger = new Logger(ChatRoomService.name);
  constructor(
    private readonly firebase: FirebaseService,
    private readonly realtime: ChatRoomGateway,
  ) {}

  private connection(id: string) {
    return this.firebase.firestore.collection('connections').doc(requireId(id));
  }

  private checkParticipant(data: ChatData | undefined, uid: string): asserts data is ChatData {
    if (!data || !Array.isArray(data.participants) ||
        data.participants.length !== 2 || !data.participants.includes(uid)) {
      // A nonparticipant must not be able to enumerate private conversations.
      throw new NotFoundException('Chat not found');
    }
    if (data.status !== 'CONNECTED') {
      throw new ForbiddenException('Chat is no longer connected');
    }
    if (!data.activeSessionId || !data.activeRoomId) {
      throw new ConflictException('Connected chat has no active room');
    }
  }

  private otherUid(data: ChatData, uid: string): string {
    const other = data.participants.find((p: unknown) => p !== uid);
    if (typeof other !== 'string') throw new ConflictException('Invalid connection participants');
    return other;
  }

  private sessionAndRoom(connectionRef: FirebaseFirestore.DocumentReference, data: ChatData) {
    const sessionRef = connectionRef.collection('sessions').doc(requireId(data.activeSessionId));
    const roomRef = sessionRef.collection('rooms').doc(requireId(data.activeRoomId));
    return { sessionRef, roomRef };
  }

  private assertLive(session: ChatData | undefined, room: ChatData | undefined): void {
    if (!session || !room || session.status === 'CLOSED' ||
        room.status === 'REPLACED' || room.status === 'CLOSED') {
      throw new ConflictException('This room is no longer active');
    }
  }

  private async loadLive(uid: string, connectionId: string) {
    const connectionRef = this.connection(connectionId);
    const connectionDoc = await connectionRef.get();
    const connection = connectionDoc.data();
    this.checkParticipant(connection, uid);
    const { sessionRef, roomRef } = this.sessionAndRoom(connectionRef, connection);
    const [sessionDoc, roomDoc] = await Promise.all([sessionRef.get(), roomRef.get()]);
    this.assertLive(sessionDoc.data(), roomDoc.data());
    return { connectionRef, connection, sessionRef, roomRef, room: roomDoc.data()! };
  }

  private async resolvePhoto(photoPath: unknown): Promise<string | null> {
    if (typeof photoPath !== 'string' || !photoPath.trim()) return null;
    if (photoPath.startsWith('https://')) return photoPath;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) return null;
    try {
      return await getDownloadURL(getStorage().bucket(bucketName).file(photoPath));
    } catch {
      this.logger.warn('Could not resolve chat-room participant photo');
      return null;
    }
  }

  async getRoom(uid: string, connectionId: string) {
    const { connection, room } = await this.loadLive(uid, connectionId);
    const otherUserId = this.otherUid(connection, uid);
    const profileDoc = await this.firebase.firestore.collection('users').doc(otherUserId).get();
    const profile = profileDoc.data();
    return {
      connectionId,
      sessionId: connection.activeSessionId,
      roomId: connection.activeRoomId,
      activeThought: typeof connection.activeThought === 'string' && connection.activeThought.trim()
        ? connection.activeThought.trim() : DEFAULT_THOUGHT,
      // A default system thought is attributed to nobody.
      thoughtByUid: room.thoughtByUid ?? null,
      otherUser: {
        uid: otherUserId,
        name: typeof profile?.name === 'string' && profile.name.trim() ? profile.name.trim() : 'Unknown user',
        photoUrl: await this.resolvePhoto(profile?.profile_pic),
      },
      unreadCount: Number(connection.unreadCounts?.[uid]) || 0,
    };
  }

  async getMessages(uid: string, connectionId: string, rawLimit?: string, before?: string) {
    const limit = rawLimit === undefined ? 30 : Number(rawLimit);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('limit must be an integer from 1 to 50');
    }
    const { connectionRef, connection, roomRef, room } = await this.loadLive(uid, connectionId);
    let query = roomRef.collection('messages').orderBy('createdAt', 'desc').limit(limit + 1);
    if (before) {
      const cursorDoc = await roomRef.collection('messages').doc(requireId(before)).get();
      if (!cursorDoc.exists) throw new BadRequestException('Invalid message cursor');
      query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();

    // A room may be replaced while its page is being queried.
    const fresh = (await connectionRef.get()).data();
    this.checkParticipant(fresh, uid);
    if (fresh.activeSessionId !== connection.activeSessionId ||
        fresh.activeRoomId !== connection.activeRoomId) {
      throw new ConflictException('Room changed; reload the conversation');
    }

    const hasMore = snapshot.docs.length > limit;
    const page = snapshot.docs.slice(0, limit);
    const nextCursor = hasMore && page.length ? page[page.length - 1].id : null;
    const messages = page.map((doc) => toMessage(doc.id, doc.data())).reverse();

    // Existing request-accept API may have created the default room without a
    // THOUGHT_START message. Materialize one *virtually* only for that room.
    // New Explore rooms get a stored THOUGHT_START inside the transaction.
    if (!hasMore && !messages.some((m) => m.type === 'THOUGHT_START') &&
        room.thoughtByUid == null) {
      messages.unshift({
        id: `start_${roomRef.id}`,
        type: 'THOUGHT_START' as const,
        content: connection.activeThought || DEFAULT_THOUGHT,
        senderId: null,
        createdAt: iso(room.createdAt ?? connection.connectedAt),
      });
    }
    return { roomId: roomRef.id, messages, nextCursor, hasMore };
  }

  async send(
    uid: string, connectionId: string, expectedRoomId: string,
    clientMessageId: string, rawText: string, type: 'TEXT' | 'THOUGHT_PROPOSAL',
  ) {
    requireId(expectedRoomId);
    requireId(clientMessageId);
    const content = cleanedText(rawText, type === 'TEXT' ? 4000 : 280);
    const connectionRef = this.connection(connectionId);
    const db = this.firebase.firestore;
    const outcome = await db.runTransaction(async (tx) => {
      const connDoc = await tx.get(connectionRef);
      const connection = connDoc.data();
      this.checkParticipant(connection, uid);
      if (connection.activeRoomId !== expectedRoomId) {
        throw new ConflictException('Room changed; reload the conversation');
      }
      const { sessionRef, roomRef } = this.sessionAndRoom(connectionRef, connection);
      const messageRef = roomRef.collection('messages').doc(`${uid}_${clientMessageId}`);
      // Read everything before the first transaction write.
      const [sessionDoc, roomDoc, existing] = await Promise.all([
        tx.get(sessionRef), tx.get(roomRef), tx.get(messageRef),
      ]);
      this.assertLive(sessionDoc.data(), roomDoc.data());
      if (existing.exists) {
        const original = existing.data()!;
        if (original.senderId !== uid || original.type !== type || original.content !== content) {
          throw new ConflictException('Duplicate clientMessageId has different content');
        }
        return { message: toMessage(existing.id, original), duplicated: true, sessionId: connection.activeSessionId };
      }
      const otherUid = this.otherUid(connection, uid);
      const unreadCounts: Record<string, number> = {
        [uid]: Math.max(0, Number(connection.unreadCounts?.[uid]) || 0),
        [otherUid]: Math.max(0, Number(connection.unreadCounts?.[otherUid]) || 0) + 1,
      };
      const createdAt = Timestamp.now();
      const message: ChatData = { type, senderId: uid, content, createdAt };
      if (type === 'THOUGHT_PROPOSAL') message.proposalStatus = 'PENDING';
      tx.create(messageRef, message);
      tx.update(connectionRef, {
        unreadCounts,
        unreadFor: Object.keys(unreadCounts).filter((id) => unreadCounts[id] > 0),
        lastIncomingMessageId: {
          ...(connection.lastIncomingMessageId ?? {}),
          [otherUid]: messageRef.id,
        },
        lastActivityAt: createdAt,
        updatedAt: createdAt,
      });
      return { message: toMessage(messageRef.id, message), duplicated: false, sessionId: connection.activeSessionId };
    });
    if (!outcome.duplicated) {
      this.realtime.emitToRoom(connectionId, outcome.sessionId, expectedRoomId, 'chat:message', { message: outcome.message });
    }
    const { sessionId: _internalSessionId, ...response } = outcome;
    return response;
  }

  async markRead(uid: string, connectionId: string, expectedRoomId: string, lastSeenMessageId: string) {
    requireId(expectedRoomId);
    requireId(lastSeenMessageId);
    const connectionRef = this.connection(connectionId);
    const db = this.firebase.firestore;
    return db.runTransaction(async (tx) => {
      const connDoc = await tx.get(connectionRef);
      const connection = connDoc.data();
      this.checkParticipant(connection, uid);
      if (connection.activeRoomId !== expectedRoomId) throw new ConflictException('Room changed');
      const { sessionRef, roomRef } = this.sessionAndRoom(connectionRef, connection);
      const messageRef = roomRef.collection('messages').doc(lastSeenMessageId);
      const [sessionDoc, roomDoc, messageDoc] = await Promise.all([
        tx.get(sessionRef), tx.get(roomRef), tx.get(messageRef),
      ]);
      this.assertLive(sessionDoc.data(), roomDoc.data());
      // A read acknowledgement must actually refer to a received message.
      if (!messageDoc.exists || messageDoc.data()?.senderId === uid ||
          messageDoc.data()?.type === 'THOUGHT_START') {
        throw new BadRequestException('lastSeenMessageId must be a received message');
      }
      if (connection.lastIncomingMessageId?.[uid] !== lastSeenMessageId) {
        // Do not accidentally mark newer messages as read.
        return { cleared: false, unreadCount: Number(connection.unreadCounts?.[uid]) || 0 };
      }
      const otherUid = this.otherUid(connection, uid);
      const unreadCounts = {
        [uid]: 0,
        [otherUid]: Math.max(0, Number(connection.unreadCounts?.[otherUid]) || 0),
      };
      tx.update(connectionRef, {
        unreadCounts,
        unreadFor: Object.keys(unreadCounts).filter((id) => unreadCounts[id] > 0),
        // Deliberately do not update lastActivityAt: a read is not new chat activity.
      });
      return { cleared: true, unreadCount: 0 };
    });
  }

  async decide(
    uid: string, connectionId: string, expectedRoomId: string, messageId: string,
    decision: 'EXPLORE' | 'REJECT',
  ) {
    requireId(expectedRoomId);
    requireId(messageId);
    const connectionRef = this.connection(connectionId);
    const db = this.firebase.firestore;
    const result = await db.runTransaction(async (tx) => {
      const connDoc = await tx.get(connectionRef);
      const connection = connDoc.data();
      this.checkParticipant(connection, uid);
      if (connection.activeRoomId !== expectedRoomId) {
        throw new ConflictException('Room changed; refresh the conversation');
      }
      const { sessionRef, roomRef } = this.sessionAndRoom(connectionRef, connection);
      const proposalRef = roomRef.collection('messages').doc(messageId);
      const [sessionDoc, roomDoc, proposalDoc] = await Promise.all([
        tx.get(sessionRef), tx.get(roomRef), tx.get(proposalRef),
      ]);
      this.assertLive(sessionDoc.data(), roomDoc.data());
      if (!proposalDoc.exists || proposalDoc.data()?.type !== 'THOUGHT_PROPOSAL') {
        throw new NotFoundException('Thought proposal not found');
      }
      const proposal = proposalDoc.data()!;
      if (proposal.senderId === uid) throw new ForbiddenException('Only recipient can decide');
      if ((proposal.proposalStatus ?? 'PENDING') !== 'PENDING') {
        throw new ConflictException('Thought proposal already decided');
      }
      const now = Timestamp.now();
      if (decision === 'REJECT') {
        tx.update(proposalRef, { proposalStatus: 'REJECTED', decidedBy: uid, decidedAt: now });
        return { decision, roomId: expectedRoomId, activeThought: connection.activeThought, sessionId: connection.activeSessionId, oldRoomRef: null };
      }
      // The switch is atomic. The old room is immediately inaccessible to both
      // participants even before its nested messages are physically purged.
      const newRoomRef = sessionRef.collection('rooms').doc();
      const startRef = newRoomRef.collection('messages').doc();
      const thought = cleanedText(proposal.content as string, 280);
      tx.create(newRoomRef, {
        status: 'ACTIVE', thought, thoughtByUid: proposal.senderId,
        createdAt: now, activatedAt: now,
      });
      tx.create(startRef, {
        type: 'THOUGHT_START', senderId: proposal.senderId,
        content: thought, createdAt: now,
      });
      tx.update(roomRef, { status: 'REPLACED', replacedAt: now, replacedBy: newRoomRef.id });
      tx.update(connectionRef, {
        activeRoomId: newRoomRef.id,
        activeThought: thought,
        unreadCounts: Object.fromEntries(connection.participants.map((id: string) => [id, 0])),
        unreadFor: [],
        lastIncomingMessageId: {},
        lastActivityAt: now,
        updatedAt: now,
      });
      return {
        decision, roomId: newRoomRef.id, activeThought: thought,
        thoughtStart: toMessage(startRef.id, {
          type: 'THOUGHT_START', senderId: proposal.senderId, content: thought, createdAt: now,
        }),
        oldRoomRef: roomRef, sessionId: connection.activeSessionId,
      };
    });
    if (result.decision === 'REJECT') {
      this.realtime.emitToRoom(connectionId, result.sessionId, expectedRoomId, 'chat:thought_rejected', { messageId });
    } else {
      this.realtime.emitToRoom(connectionId, result.sessionId, expectedRoomId, 'chat:room_switched', {
        newRoomId: result.roomId, activeThought: result.activeThought,
      });
    }
    if (result.oldRoomRef) {
      // Failure to physically delete must never turn a committed switch into a
      // client-visible failure. Run a retryable cleanup task in production.
      void this.purgeOldTree(result.oldRoomRef);
    }
    const { oldRoomRef: _internal, sessionId: _sessionId, ...response } = result;
    return response;
  }

  async close(uid: string, connectionId: string, expectedRoomId: string) {
    requireId(expectedRoomId);
    const connectionRef = this.connection(connectionId);
    const db = this.firebase.firestore;
    const closed = await db.runTransaction(async (tx) => {
      const connDoc = await tx.get(connectionRef);
      const connection = connDoc.data();
      this.checkParticipant(connection, uid);
      if (connection.activeRoomId !== expectedRoomId) throw new ConflictException('Room changed');
      const { sessionRef, roomRef } = this.sessionAndRoom(connectionRef, connection);
      const [sessionDoc, roomDoc] = await Promise.all([tx.get(sessionRef), tx.get(roomRef)]);
      this.assertLive(sessionDoc.data(), roomDoc.data());
      const now = Timestamp.now();
      tx.update(roomRef, { status: 'CLOSED', closedAt: now });
      tx.update(sessionRef, { status: 'CLOSED', closedAt: now });
      tx.update(connectionRef, {
        status: 'CLOSED', closedAt: now, closedBy: uid,
        activeSessionId: null, activeRoomId: null, activeThought: null,
        unreadCounts: Object.fromEntries(connection.participants.map((id: string) => [id, 0])),
        unreadFor: [], lastIncomingMessageId: {}, updatedAt: now,
      });
      return { sessionRef, sessionId: connection.activeSessionId };
    });
    this.realtime.emitToRoom(connectionId, closed.sessionId, expectedRoomId, 'chat:connection_closed', {});
    void this.purgeOldTree(closed.sessionRef);
    return { status: 'CLOSED' as const };
  }

  private async purgeOldTree(ref: FirebaseFirestore.DocumentReference) {
    try {
      await this.firebase.firestore.recursiveDelete(ref);
    } catch (error) {
      this.logger.error(`Chat cleanup failed for ${ref.path}; schedule a retry`, error instanceof Error ? error.stack : String(error));
    }
  }
}
