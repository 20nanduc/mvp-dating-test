import { firebaseAuth, storage } from "@/config/firebase";

import {
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { createMatchImages } from "./imageProcessor";

import type { MatchPreferences } from "../schemas/match.schema";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Upload a single image to Firebase Storage.
 */
function uploadImage(
  path: string,
  blob: Blob,
  onProgress?: (uploadedBytes: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, blob, {
      contentType: "image/webp",
    });

    task.on(
      "state_changed",

      (snapshot) => {
        onProgress?.(snapshot.bytesTransferred);
      },

      (error) => {
        reject(error);
      },

      () => {
        onProgress?.(blob.size);
        resolve();
      }
    );
  });
}

/**
 * Upload profile images and update Firestore through NestJS.
 */
export async function saveMatchProfile(
  values: MatchPreferences,
  onProgress?: (percentage: number) => void
): Promise<void> {
  // 1. Verify authenticated user
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again");
  }

  const token = await currentUser.getIdToken();

  // 2. Generate optimized images
  const { full, thumb } = await createMatchImages(
    values.photo
  );

  // 3. Generate unique Storage paths
  const photoId = crypto.randomUUID();

  const basePath =
    `users/${currentUser.uid}/profile/${photoId}`;

  const fullPath = `${basePath}/full.webp`;
  const thumbPath = `${basePath}/thumb.webp`;

  // 4. Calculate upload progress
  const totalBytes = full.size + thumb.size;

  const reportProgress = (uploadedBytes: number) => {
    const percentage = Math.round(
      (uploadedBytes / totalBytes) * 100
    );

    onProgress?.(Math.min(percentage, 100));
  };

  // 5. Upload full image
  await uploadImage(
    fullPath,
    full,
    (uploaded) => {
      reportProgress(uploaded);
    }
  );

  // 6. Upload thumbnail
  await uploadImage(
    thumbPath,
    thumb,
    (uploaded) => {
      reportProgress(full.size + uploaded);
    }
  );

  // 7. Update profile through NestJS
  const response = await fetch(`${API_URL}/users/me/match`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      profile_pic: fullPath,
      profile_pic_thumb: thumbPath,
      interests: values.interests,
    }),
  });

  // 8. Handle API errors
  if (!response.ok) {
    const result = (await response
      .json()
      .catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = result?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : message || "Unable to update profile"
    );
  }
}