import { createHash } from "node:crypto";

export function getCanonicalPairId(
  userA: string,
  userB: string,
): string {
  const sortedIds = [userA, userB].sort();

  return createHash("sha256")
    .update(JSON.stringify(sortedIds))
    .digest("hex");
}