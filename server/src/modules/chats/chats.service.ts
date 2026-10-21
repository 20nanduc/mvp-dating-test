import { Injectable, Logger } from '@nestjs/common';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { FirebaseService } from '../../firebase/firebase.service';

const DEFAULT_THOUGHT = "Let's get to know each other";

// ---------------- TYPES ----------------

type ConnectionData = {
  participants?: string[];
  status?: string;
  activeThought?: string;
  unreadCounts?: Record<string, number>;
  lastActivityAt?: FirebaseFirestore.Timestamp;
  connectedAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  createdAt?: FirebaseFirestore.Timestamp;
};

type ProfileData = {
  name?: string;
  profile_pic?: string;
};

type ChatPreview = {
  connectionId: string;
  name: string;
  photoUrl: string | null;
  activeThought: string;
  unreadCount: number;
};

type ConnectedChat = ChatPreview & {
  otherUserId: string;
  sortTime: number;
};

// ---------------- SERVICE ----------------

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly firebase: FirebaseService,
  ) {}

  // ========================================
  // GET /chats
  // ========================================

  async getChats(uid: string): Promise<{ chats: ChatPreview[] }> {
    const db = this.firebase.firestore;

    // 1. Fetch only accepted connections
    // belonging to the authenticated user.

    const snapshot = await db
      .collection('connections')
      .where('participants', 'array-contains', uid)
      .where('status', '==', 'CONNECTED')
      .get();

    if (snapshot.empty) {
      return { chats: [] };
    }

    // 2. Extract connection information.

    const connections: ConnectedChat[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as ConnectionData;

      const participants = data.participants;

      if (
        !Array.isArray(participants) ||
        participants.length !== 2 ||
        !participants.includes(uid)
      ) {
        continue;
      }

      const otherUserId = participants.find(
        (id) => id !== uid,
      );

      if (!otherUserId) continue;

      const unreadCount =
        data.unreadCounts?.[uid] ?? 0;

      connections.push({
        connectionId: doc.id,
        otherUserId,

        name: '',
        photoUrl: null,

        activeThought:
          data.activeThought?.trim() || DEFAULT_THOUGHT,

        unreadCount:
          Number.isSafeInteger(unreadCount) && unreadCount > 0
            ? unreadCount
            : 0,

        sortTime:
          data.lastActivityAt?.toMillis() ??
          data.connectedAt?.toMillis() ??
          data.updatedAt?.toMillis() ??
          data.createdAt?.toMillis() ??
          0,
      });
    }

    if (connections.length === 0) {
      return { chats: [] };
    }

    // 3. Sort by latest activity.

    connections.sort(
      (a, b) => b.sortTime - a.sortTime,
    );

    // 4. Batch-fetch other participants.
    // Avoid one Firestore query per connection.

    const otherUserIds = [
      ...new Set(connections.map((c) => c.otherUserId)),
    ];

    const profileMap = new Map<string, ProfileData>();

    // Chunk reads to keep batches manageable.

    for (let i = 0; i < otherUserIds.length; i += 100) {
      const ids = otherUserIds.slice(i, i + 100);

      const refs = ids.map((id) =>
        db.collection('users').doc(id),
      );

      const profiles = await db.getAll(...refs);

      for (const profile of profiles) {
        if (!profile.exists) continue;

        profileMap.set(
          profile.id,
          profile.data() as ProfileData,
        );
      }
    }

    // 5. Enrich chats with user profiles.

    const chats: ChatPreview[] = await Promise.all(
      connections.map(async (connection) => {
        const profile = profileMap.get(
          connection.otherUserId,
        );

        const photoUrl = await this.resolveProfilePhoto(
          profile?.profile_pic,
        );

        return {
          connectionId: connection.connectionId,
          name: profile?.name?.trim() || 'Unknown user',
          photoUrl,
          activeThought: connection.activeThought,
          unreadCount: connection.unreadCount,
        };
      }),
    );

    return { chats };
  }

  // ========================================
  // GET /chats/unread-count
  // ========================================

  async getUnreadChatsCount(
    uid: string,
  ): Promise<{ count: number }> {
    // Count conversations, NOT individual messages.

    const result = await this.firebase.firestore
      .collection('connections')
      .where('unreadFor', 'array-contains', uid)
      .where('status', '==', 'CONNECTED')
      .count()
      .get();

    return {
      count: result.data().count,
    };
  }

  // ========================================
  // PROFILE PHOTO RESOLVER
  // ========================================

  private async resolveProfilePhoto(
    photoPath?: string,
  ): Promise<string | null> {
    if (!photoPath?.trim()) {
      return null;
    }

    // Already a public/download URL.
    if (photoPath.startsWith('https://')) {
      return photoPath;
    }

    try {
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

      if (!bucketName) {
        this.logger.warn(
          'FIREBASE_STORAGE_BUCKET is not configured',
        );
        return null;
      }

      const file = getStorage()
        .bucket(bucketName)
        .file(photoPath);

      return await getDownloadURL(file);
    } catch (error) {
      this.logger.warn(
        'Unable to resolve chat profile photo',
      );

      return null;
    }
  }
}