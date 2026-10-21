import { z } from "zod";

export const discoveryProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  dob: z.string(),
  state: z.string(),
  profilePic: z.string().nullable().optional(),
  interests: z.array(z.string()).default([]),
});

export type DiscoveryProfile = z.infer<typeof discoveryProfileSchema>;

export const discoveryPageSchema = z.object({
  items: z.array(discoveryProfileSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type DiscoveryPageResponse = z.infer<typeof discoveryPageSchema>;