import { firebaseAuth } from "@/config/firebase";

import {
  chatsResponseSchema,
  unreadChatsCountSchema,
  type ChatsResponse,
  type UnreadChatsCountResponse,
} from "@/features/chats/schemas/chats.schemas";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

// ---------------- ERROR ----------------

export class ChatsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = "ChatsApiError";
    this.status = status;
  }
}

// ---------------- API CLIENT ----------------

async function getAuthenticatedJson(
  endpoint: string
): Promise<unknown> {
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new ChatsApiError(
      401,
      "Authentication required"
    );
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ChatsApiError(
      response.status,
      `Chats API failed: ${response.status}`
    );
  }

  return response.json();
}

// ---------------- CHATS SERVICE ----------------

export const chatsService = {
  // GET /chats
  async getChats(): Promise<ChatsResponse> {
    const response = await getAuthenticatedJson("/chats");

    return chatsResponseSchema.parse(response);
  },

  // GET /chats/unread-count
  async getUnreadChatsCount(): Promise<UnreadChatsCountResponse> {
    const response = await getAuthenticatedJson(
      "/chats/unread-count"
    );

    return unreadChatsCountSchema.parse(response);
  },
};