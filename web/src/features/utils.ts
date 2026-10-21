import type { LoginResponse } from "@/features/auth/services/authService";

type User = LoginResponse["user"];

export function getPostLoginRoute(user: User): string {
  if (!user.isProfileCreated) {
    return "/onboarding/account";
  }

  if (!user.isProfileShared) {
    return "/onboarding/match";
  }

  return "/app/discover";
}