import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { AccountDetails } from "../schemas/account.schema";
import { createAccountRequest } from "../services/onboardingService";

export function useCreateAccount() {
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");

  const createAccount = async (values: AccountDetails): Promise<boolean> => {
    setError("");

    try {
      // 1. Update Firestore through NestJS
      await createAccountRequest(values);

      // 2. Synchronize AuthContext with updated user document
      const user = await refreshUser();

      if (!user.isProfileCreated) {
        throw new Error("Account creation could not be verified");
      }

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create account"
      );
      return false;
    }
  };

  return { createAccount, error };
}