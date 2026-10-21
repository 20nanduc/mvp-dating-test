// src/discovery/discovery.service.ts

import { Injectable } from "@nestjs/common";
import { FieldPath } from "firebase-admin/firestore";

import { FirebaseService } from "../../firebase/firebase.service";

import { getCanonicalPairId } from "../../utils/connection-pair-id.util";

interface DiscoveryProfile {
  id: string;
  name: string;
  dob: string;
  state: string;
  profilePic: string;
  interests: string[];
}

export interface DiscoveryResponse {
  items: DiscoveryProfile[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly firebaseService: FirebaseService,
  ) {}

  async discover(
    viewerUid: string,
    limit: number,
    cursor?: string,
  ): Promise<DiscoveryResponse> {
    // Use the Firestore instance exposed by your FirebaseService.
    const db = this.firebaseService.firestore;

    const usersRef = db.collection("users");
    const connectionsRef = db.collection("connections");

    const items: DiscoveryProfile[] = [];

    let lastScannedId: string | null = cursor ?? null;
    let exhausted = false;
    let scanned = 0;

    const SCAN_CHUNK = 20;
    const MAX_SCAN = 200;

    while (items.length < limit && scanned < MAX_SCAN) {
      const fetchLimit = Math.min(
        SCAN_CHUNK,
        MAX_SCAN - scanned,
      );

      let query = usersRef
        .where("isProfileShared", "==", true)
        .orderBy(FieldPath.documentId())
        .limit(fetchLimit);

      if (lastScannedId) {
        query = query.startAfter(lastScannedId);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        exhausted = true;
        break;
      }

      // Exclude current user before checking connections.
      const candidates = snapshot.docs.filter(
        (doc) => doc.id !== viewerUid,
      );

      /*
       * Fetch relationship documents in one batch.
       * Missing documents are allowed.
       *
       * This avoids one sequential Firestore request
       * per candidate.
       */
      const connectionSnapshots = candidates.length
        ? await db.getAll(
            ...candidates.map((doc) =>
              connectionsRef.doc(
                getCanonicalPairId(viewerUid, doc.id),
              ),
            ),
          )
        : [];

      const connectedIds = new Set<string>();

      candidates.forEach((doc, index) => {
        const connection = connectionSnapshots[index];

        if (connection.get("status") === "CONNECTED") {
          connectedIds.add(doc.id);
        }
      });

      let processedCount = 0;

      for (const doc of snapshot.docs) {
        processedCount++;
        scanned++;

        // Advance by examined document, not returned item.
        lastScannedId = doc.id;

        if (doc.id === viewerUid) continue;

        if (connectedIds.has(doc.id)) continue;

        const data = doc.data();

        // Ignore incomplete published records.
        if (
          typeof data.name !== "string" ||
          typeof data.dob !== "string" ||
          typeof data.state !== "string" ||
          typeof data.profile_pic !== "string" ||
          !data.name ||
          !data.dob ||
          !data.profile_pic
        ) {
          continue;
        }

        items.push({
          id: doc.id,
          name: data.name,
          dob: data.dob,
          state: data.state,
          profilePic: data.profile_pic,
          interests: Array.isArray(data.interests)
            ? data.interests.filter(
                (interest: unknown): interest is string =>
                  typeof interest === "string",
              )
            : [],
        });

        if (items.length >= limit) {
          break;
        }
      }

      // A short query result means there are no more
      // Firestore documents after this chunk.
      if (
        processedCount === snapshot.docs.length &&
        snapshot.docs.length < fetchLimit
      ) {
        exhausted = true;
        break;
      }
    }

    return {
      items,
      nextCursor: exhausted ? null : lastScannedId,
      hasMore: !exhausted,
    };
  }
}