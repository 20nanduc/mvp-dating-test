import { firebaseAuth } from "@/config/firebase";

export interface IncomingRequest {
  id: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    dob: string;
    state: string;
    profilePic: string | null;
    interests: string[];
  };
}

export const REQUESTS_KEY = "/connections/requests?type=received";
export const REQUESTS_COUNT_KEY = "/connections/requests/count";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await firebaseAuth.currentUser?.getIdToken();

  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const requestService = {
  getIncoming: () =>
    apiRequest<IncomingRequest[]>(REQUESTS_KEY),

  getCount: () =>
    apiRequest<{ count: number }>(REQUESTS_COUNT_KEY),

  decide: (id: string, action: "accept" | "reject") =>
    apiRequest(`/connections/requests/${id}/${action}`, {
      method: "PATCH",
    }),
};