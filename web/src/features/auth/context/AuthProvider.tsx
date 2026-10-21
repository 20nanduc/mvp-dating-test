import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/config/firebase";

import {
  syncAuthenticatedUser,
  type LoginResponse,
} from "@/features/auth/services/authService";

type User = LoginResponse["user"];

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  refreshUser: () => Promise<User>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    let version = 0;

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        const currentVersion = ++version;

        // No Firebase session
        if (!firebaseUser) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        setUser(null);
        setStatus("loading");

        try {
          const response = await syncAuthenticatedUser(firebaseUser);

          if (!active || currentVersion !== version) return;

          setUser(response.user);
          setStatus("authenticated");
        } catch (error) {
          if (!active || currentVersion !== version) return;

          console.error("Session verification failed:", error);

          setUser(null);
          setStatus("error");
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);


  const refreshUser = async () => {
    const firebaseUser = firebaseAuth.currentUser;

    if (!firebaseUser) {
      throw new Error("User is not authenticated");
    }

    const response = await syncAuthenticatedUser(firebaseUser);

    setUser(response.user);

    return response.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === "authenticated",
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}