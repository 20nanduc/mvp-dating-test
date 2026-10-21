import { useRef, useState } from "react";
import { signInWithGoogle } from "@/features/auth/services/authService";

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inProgress = useRef(false);

  const signIn = async () => {
    if (inProgress.current) return;

    inProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();

      // AuthProvider detects the Firebase session
      // and calls our NestJS login API.
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      inProgress.current = false;
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, error,  };
}