import { z } from "zod";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const interestsSchema = z.array(
  z.string().trim().min(2, "Interests need at least 2 characters").max(32, "Keep each interest under 33 characters"),
)
  .min(1, "Add at least one interest")
  .max(8, "Choose at most 8 interests")
  .refine(
    interests => new Set(interests.map(value => value.toLowerCase())).size === interests.length,
    "Remove duplicate interests",
  );


export const matchSchema = z.object({
  photo: z.instanceof(File, {
    message: "Please select a photo",
  }),

  interests: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Select at least one interest")
    .max(10, "Maximum 10 interests")
    .refine(
      (items) =>
        new Set(
          items.map((item) => item.toLowerCase())
        ).size === items.length,
      "Duplicate interests are not allowed"
    ),
});

export type MatchPreferences = z.infer<typeof matchSchema>;