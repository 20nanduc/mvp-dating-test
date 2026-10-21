import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth/context/AuthProvider";

type Props = {
  step: "account" | "match" | "discover";
};

export function OnboardingGuard({ step }: Props) {
  const { user, status } = useAuth();

  // ProtectedRoute handles authentication and loading
  if (status !== "authenticated" || !user) {
    return null;
  }

  // Account creation page
  if (step === "account") {
    if (user.isProfileCreated) {
      return (
        <Navigate
          to={user.isProfileShared ? "/app/discover" : "/onboarding/match"}
          replace
        />
      );
    }

    return <Outlet />;
  }

  // Match and Discover require account creation
  if (!user.isProfileCreated) {
    return <Navigate to="/onboarding/account" replace />;
  }

  // Discover requires completed onboarding
  if (step === "discover" && !user.isProfileShared) {
    return <Navigate to="/onboarding/match" replace />;
  }

  // Completed onboarding users go to Discover
  if (step === "match" && user.isProfileShared) {
    return <Navigate to="/app/discover" replace />;
  }

  return <Outlet />;
}