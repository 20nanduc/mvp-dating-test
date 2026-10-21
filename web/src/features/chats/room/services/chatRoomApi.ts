import { getAuth } from 'firebase/auth';
import { z } from 'zod';
import {
  chatRoomSchema,
  messageMutationSchema,
  messagesPageSchema,
  readResultSchema,
  thoughtDecisionSchema,
  type ThoughtDecision,
} from '../types/chatRoomApi.types';

// Match the variable already used in your frontend. The fallback is for local development.
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SOCKET_ORIGIN =
  import.meta.env.VITE_SOCKET_URL || new URL(API_BASE, window.location.origin).origin;

export class ChatApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const user = getAuth().currentUser;
  if (!user) throw new ChatApiError(401, 'Please sign in again.');
  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const err = data as { message?: string | string[] } | null;
    const message = Array.isArray(err?.message) ? err.message.join(', ') : err?.message;
    throw new ChatApiError(response.status, message || `Chat request failed (${response.status})`);
  }
  return schema.parse(data);
}

const base = (connectionId: string) => `/chat-rooms/${encodeURIComponent(connectionId)}`;
const postBody = (body: object): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const chatRoomApi = {
  getRoom: (connectionId: string) => request(base(connectionId), chatRoomSchema),

  getMessages: (connectionId: string, before?: string, limit = 30) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set('before', before);
    return request(`${base(connectionId)}/messages?${query}`, messagesPageSchema);
  },

  sendMessage: (connectionId: string, roomId: string, text: string, clientMessageId: string) =>
    request(`${base(connectionId)}/messages`, messageMutationSchema,
      postBody({ roomId, text, clientMessageId })),

  proposeThought: (connectionId: string, roomId: string, text: string, clientMessageId: string) =>
    request(`${base(connectionId)}/thoughts`, messageMutationSchema,
      postBody({ roomId, text, clientMessageId })),

  decideThought: (connectionId: string, roomId: string, messageId: string, decision: ThoughtDecision) =>
    request(`${base(connectionId)}/thoughts/${encodeURIComponent(messageId)}/decision`,
      thoughtDecisionSchema, { method: 'PATCH', body: JSON.stringify({ roomId, decision }) }),

  markRead: (connectionId: string, roomId: string, lastSeenMessageId: string) =>
    request(`${base(connectionId)}/read`, readResultSchema, postBody({ roomId, lastSeenMessageId })),

  closeConnection: (connectionId: string, roomId: string) =>
    request(`${base(connectionId)}/close`, z.object({ status: z.literal('CLOSED') }), postBody({ roomId })),
};
