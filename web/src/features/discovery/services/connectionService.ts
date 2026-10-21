import { firebaseAuth } from "@/config/firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface sendConnectionResponse {
  success: true;
  connectionId: string;
  status: "PENDING";
}

export async function sendConnectionRequest(
  receiverId: string,
): Promise<sendConnectionResponse> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    throw new Error("Please sign in again.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(
    `${API_BASE_URL}/connections/requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId,
      }),
    },
  );

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Unable to send curiosity. Please try again.";

    if (body && typeof body === "object" && "message" in body) {
      const value = (body as { message: unknown }).message;

      if (typeof value === "string") {
        message = value;
      } else if (Array.isArray(value)) {
        message = value.join(", ");
      }
    }

    throw new Error(message);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("status" in body) ||
    body.status !== "PENDING"
  ) {
    throw new Error("Unexpected response from the request service.");
  }

  return body as unknown as sendConnectionResponse;
}