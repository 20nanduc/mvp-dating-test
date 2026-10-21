import { z } from "zod";
import { INDIAN_STATES_AND_UTS } from "../constants/indianLocations";

export const GENDER_OPTIONS = [
  "Woman", "Man", "Non-binary",
] as const;

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

export function latestEligibleDob(): string {
  const today = new Date();
  const eligible = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const year = eligible.getFullYear();
  const month = String(eligible.getMonth() + 1).padStart(2, "0");
  const day = String(eligible.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(60),
  dateOfBirth: z.string()
    .refine(isRealDate, "Enter a valid date")
    .refine(
      value => !isRealDate(value) || value <= latestEligibleDob(),
      "You must be at least 18"
    ),
  gender: z.enum(GENDER_OPTIONS),
  state: z.enum(INDIAN_STATES_AND_UTS),
});


export type AccountDetails = z.infer<typeof accountSchema>;



