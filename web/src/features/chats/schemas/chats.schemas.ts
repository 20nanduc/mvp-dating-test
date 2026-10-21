import { z } from "zod";

export const chatPreviewSchema = z.object({
  connectionId: z.string().min(1),

  name: z.string().min(1),

  photoUrl: z.string().nullable(),

  activeThought: z.string(),

  unreadCount: z.number().int().nonnegative(),
});

export const chatsResponseSchema = z.object({
  chats: z.array(chatPreviewSchema),
});

export const unreadChatsCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type ChatPreview = z.infer<typeof chatPreviewSchema>;

export type ChatsResponse = z.infer<typeof chatsResponseSchema>;

export type UnreadChatsCountResponse = z.infer<
  typeof unreadChatsCountSchema
>;