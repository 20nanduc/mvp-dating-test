import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from 'firebase-admin/firestore';

import {
  getStorage,
  getDownloadURL,
} from 'firebase-admin/storage';

import { FirebaseService } from '../../firebase/firebase.service';
import { getCanonicalPairId } from '../../utils/connection-pair-id.util';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly firebase: FirebaseService,
  ) {}

  // =====================================================
  // 1. CREATE CURIOSITY REQUEST
  // POST /connections/requests
  // =====================================================

  async createRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'Cannot send a request to yourself',
      );
    }

    const db = this.firebase.firestore;

    const pairId = getCanonicalPairId(senderId, receiverId);

    const connectionRef = db.collection('connections').doc(pairId);
    const senderRef = db.collection('users').doc(senderId);
    const receiverRef = db.collection('users').doc(receiverId);

    return db.runTransaction(async (tx) => {
      const [sender, receiver, existing] = await Promise.all([
        tx.get(senderRef),
        tx.get(receiverRef),
        tx.get(connectionRef),
      ]);

      if (
        !sender.exists ||
        sender.get('isProfileCreated') !== true ||
        sender.get('isProfileShared') !== true
      ) {
        throw new ForbiddenException(
          'Complete your profile before sending requests',
        );
      }

      if (
        !receiver.exists ||
        receiver.get('isProfileShared') !== true
      ) {
        throw new NotFoundException(
          'Profile is not available',
        );
      }

      if (existing.exists) {
        const connection = existing.data();

        if (connection?.status === 'CONNECTED') {
          throw new ConflictException('Already connected');
        }

        if (connection?.status === 'PENDING') {
          if (connection.senderId === senderId) {
            throw new ConflictException('Request already sent');
          }

          throw new ConflictException(
            'This person has already sent you a request',
          );
        }

        throw new ConflictException(
          'Relationship already exists',
        );
      }

      tx.create(connectionRef, {
        participants: [senderId, receiverId].sort(),
        senderId,
        receiverId,
        status: 'PENDING',

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        connectedAt: null,
      });

      return {
        success: true,
        connectionId: pairId,
        status: 'PENDING',
      };
    });
  }

  // =====================================================
  // 2. GET INCOMING PENDING REQUESTS
  // GET /connections/requests?type=received
  // =====================================================

  async getIncomingRequests(userId: string) {
    const db = this.firebase.firestore;

    // Fetch only incoming pending requests.
    const snapshot = await db
      .collection('connections')
      .where('receiverId', '==', userId)
      .where('status', '==', 'PENDING')
      .orderBy('createdAt', 'asc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    // Collect unique sender IDs.
    const senderIds = [
      ...new Set(
        snapshot.docs.map(
          (doc) => doc.get('senderId') as string,
        ),
      ),
    ];

    // Batch-fetch sender profiles.
    const userRefs = senderIds.map((uid) =>
      db.collection('users').doc(uid),
    );

    const userSnapshots = await db.getAll(...userRefs);

    // Explicitly typed Map to avoid TypeScript errors.
    const userMap = new Map<string, DocumentData>();

    for (const userSnapshot of userSnapshots) {
      const data = userSnapshot.data();

      if (data) {
        userMap.set(userSnapshot.id, data);
      }
    }

    // Firebase Storage bucket.
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

    if (!bucketName) {
      throw new Error(
        'FIREBASE_STORAGE_BUCKET is not configured',
      );
    }

    const bucket = getStorage().bucket(bucketName);

    // Enrich requests with sender information.
    const requests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        const sender = userMap.get(data.senderId as string);

        if (!sender) {
          throw new NotFoundException(
            `Sender profile not found: ${data.senderId}`,
          );
        }

        // Resolve stored Firebase Storage path.
        const photoPath = sender.profile_pic as string | null;

        const profilePic = photoPath
          ? await getDownloadURL(bucket.file(photoPath))
          : null;

        const createdAt = data.createdAt as Timestamp;

        return {
          id: doc.id,
          createdAt: createdAt.toDate().toISOString(),

          sender: {
            id: data.senderId,
            name: sender.name,
            dob: sender.dob,
            state: sender.state,
            profilePic,
            interests: sender.interests ?? [],
          },
        };
      }),
    );

    return requests;
  }

  // =====================================================
  // 3. GET INCOMING REQUEST COUNT
  // GET /connections/requests/count
  // =====================================================

  async getRequestsCount(userId: string) {
    const snapshot = await this.firebase.firestore
      .collection('connections')
      .where('receiverId', '==', userId)
      .where('status', '==', 'PENDING')
      .count()
      .get();

    return {
      count: snapshot.data().count,
    };
  }

  // =====================================================
  // 4. ACCEPT OR REJECT REQUEST
  // PATCH /connections/requests/:id/accept
  // PATCH /connections/requests/:id/reject
  // =====================================================

  async decideRequest(
    connectionId: string,
    userId: string,
    action: 'accept' | 'reject',
  ) {
    if (!/^[a-f0-9]{64}$/i.test(connectionId)) {
      throw new BadRequestException(
        'Invalid connection ID',
      );
    }

    const db = this.firebase.firestore;

    const connectionRef = db
      .collection('connections')
      .doc(connectionId);

    const targetStatus =
      action === 'accept' ? 'CONNECTED' : 'REJECTED';

    // Allocate IDs outside the retryable transaction.
    const sessionRef = connectionRef
      .collection('sessions')
      .doc();

    const roomRef = sessionRef
      .collection('rooms')
      .doc();

    return db.runTransaction(async (tx) => {
      // Read before writing.
      const snapshot = await tx.get(connectionRef);

      if (!snapshot.exists) {
        throw new NotFoundException(
          'Request not found',
        );
      }

      const connection = snapshot.data()!;

      // Only the receiver can act on a request.
      if (connection.receiverId !== userId) {
        throw new ForbiddenException(
          'You cannot modify this request',
        );
      }

      // Idempotent repeated decision.
      if (connection.status === targetStatus) {
        return {
          success: true,
          connectionId,
          status: targetStatus,

          ...(action === 'accept'
            ? {
                activeSessionId: connection.activeSessionId,
                activeRoomId: connection.activeRoomId,
              }
            : {}),
        };
      }

      if (connection.status !== 'PENDING') {
        throw new ConflictException(
          'This request is no longer pending',
        );
      }

      const now = Timestamp.now();

      // -----------------------------
      // REJECT
      // -----------------------------

      if (action === 'reject') {
        tx.update(connectionRef, {
          status: 'REJECTED',
          rejectedAt: now,
          updatedAt: now,
        });

        return {
          success: true,
          connectionId,
          status: 'REJECTED',
        };
      }

      // -----------------------------
      // ACCEPT
      // -----------------------------

      const defaultThought =
        "Let's get to know each other";

      // Create default chat session.
      tx.create(sessionRef, {
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      // Create default thought room.
      tx.create(roomRef, {
        thought: defaultThought,
        createdBy: 'SYSTEM',
        originThoughtId: null,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      // Update connection.
      tx.update(connectionRef, {
        status: 'CONNECTED',
        connectedAt: now,
        updatedAt: now,

        activeSessionId: sessionRef.id,
        activeRoomId: roomRef.id,
        activeThought: defaultThought,

        lastActivityAt: now,

        version:
          typeof connection.version === 'number'
            ? connection.version + 1
            : 1,
      });

      return {
        success: true,
        connectionId,
        status: 'CONNECTED',
        activeSessionId: sessionRef.id,
        activeRoomId: roomRef.id,
      };
    });
  }
}