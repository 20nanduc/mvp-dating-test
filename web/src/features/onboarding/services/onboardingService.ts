import { firebaseAuth } from "@/config/firebase";
import type { AccountDetails } from "../schemas/account.schema";

export async function createAccountRequest(
  values: AccountDetails
): Promise<void> {
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/users/me/account`,
    {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(values),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      Array.isArray(error.message)
        ? error.message.join(", ")
        : error.message || "Failed to create account"
    );
  }
}