import {
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";


import { firebaseAuth } from "@/config/firebase";

interface User {
  auth_id: string;
  name: string | null;
  dob: string | null;
  state: string | null;
  gender: string | null;
  profile_pic: string | null;
  interests: string[];
  isProfileCreated: boolean;
  isProfileShared: boolean;
}

export interface LoginResponse {
  success: boolean;
  isNewUser: boolean;
  user: User;
}
// Trigger Google Sign-In
export function signInWithGoogle() {
  return signInWithPopup(
    firebaseAuth,
    new GoogleAuthProvider()
  );
}

// Verify Firebase identity with our backend
export async function syncAuthenticatedUser(
  firebaseUser: FirebaseUser
): Promise<LoginResponse> {
  const token = await firebaseUser.getIdToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Session verification failed: ${response.status}`);
  }

  return response.json() as Promise<LoginResponse>;
}