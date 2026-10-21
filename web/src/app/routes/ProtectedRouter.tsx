import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth/context/AuthProvider";

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <div>Checking session...</div>;
  }

  if (status === "error") {
    return (
      <div>
        <p>Unable to verify your session.</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}