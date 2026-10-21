import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['TEXT', 'THOUGHT_PROPOSAL', 'THOUGHT_START']),
  content: z.string(),
  senderId: z.string().nullable(),
  createdAt: z.string(),
  proposalStatus: z.enum(['PENDING', 'REJECTED', 'ACCEPTED']).optional(),
});

export const chatRoomSchema = z.object({
  connectionId: z.string(),
  sessionId: z.string(),
  roomId: z.string(),
  activeThought: z.string(),
  thoughtByUid: z.string().nullable(),
  otherUser: z.object({
    uid: z.string(),
    name: z.string(),
    photoUrl: z.string().nullable(),
  }),
  unreadCount: z.number().nonnegative(),
});

export const messagesPageSchema = z.object({
  roomId: z.string(),
  messages: z.array(chatMessageSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const messageMutationSchema = z.object({
  message: chatMessageSchema,
  duplicated: z.boolean(),
});

export const thoughtDecisionSchema = z.object({
  decision: z.enum(['EXPLORE', 'REJECT']),
  roomId: z.string(),
  activeThought: z.string(),
  thoughtStart: chatMessageSchema.optional(),
});

export const readResultSchema = z.object({ cleared: z.boolean(), unreadCount: z.number() });

export type ChatRoomData = z.infer<typeof chatRoomSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type MessagesPage = z.infer<typeof messagesPageSchema>;
export type ThoughtDecision = 'EXPLORE' | 'REJECT';
