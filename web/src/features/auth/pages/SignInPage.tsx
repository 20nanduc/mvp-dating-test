import { Navigate } from "react-router";

import { GoogleSignInButton } from
  "@/features/auth/components/GoogleSignInButton";

import { useGoogleSignIn } from
  "@/features/auth/hooks/useGoogleSignIn";

import { useAuth } from
  "@/features/auth/context/AuthProvider";

import { getPostLoginRoute } from
  "@/features/utils";

export function SignInPage() {
  const { signIn, isLoading, error } = useGoogleSignIn();
  const { user, status } = useAuth();

  // Redirect only after backend authentication succeeds
  if (status === "authenticated" && user) {
    return <Navigate to={getPostLoginRoute(user)} replace />;
  }

  const checkingSession = status === "loading";

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">

        <header className="flex flex-1 items-center justify-center">
          <div className="text-4xl font-bold tracking-tight text-[#f27356]">
            Know Each Other Better
          </div>
        </header>

        <div className="mb-6 flex w-full flex-col items-center gap-4">
          <div className="w-full max-w-[280px]">
            <GoogleSignInButton
              onClick={signIn}
              loading={isLoading || checkingSession}
            />
          </div>

          {checkingSession && !isLoading && (
            <p role="status" className="text-sm">
              Checking session...
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          {status === "error" && (
            <div className="text-center text-sm text-red-500">
              <p>Unable to verify your session.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}