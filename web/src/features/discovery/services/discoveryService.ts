import { firebaseAuth, getProfileImageUrl } from "@/config/firebase";

import {
  discoveryPageSchema,
  type DiscoveryPageResponse,
} from "../schemas/discovery.schemas";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

export async function fetchDiscoveryPage(
  cursor: string | null,
  limit = 10,
): Promise<DiscoveryPageResponse> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const url = new URL("/discovery", API_BASE_URL);

  url.searchParams.set("limit", String(limit));

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Unable to load discovery profiles.");
  }

  const data = discoveryPageSchema.parse(body);

  // Convert Firebase Storage paths into downloadable URLs.
  const items = await Promise.all(
    data.items.map(async (profile) => {
      if (!profile.profilePic) {
        return {
          ...profile,
          profilePic: "",
        };
      }

      try {
        const imageUrl = await getProfileImageUrl(
          profile.profilePic,
        );

        return {
          ...profile,
          profilePic: imageUrl,
        };
      } catch (error) {
        console.error(
          "Failed to load profile image:",
          error,
        );

        return {
          ...profile,
          profilePic: "",
        };
      }
    }),
  );

  return {
    ...data,
    items,
  };
}