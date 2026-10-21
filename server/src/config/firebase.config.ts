import { ConfigService } from '@nestjs/config';

import {
  initializeApp,
  getApp,
  getApps,
  cert,
  applicationDefault,
} from 'firebase-admin/app';

import {
  getFirestore,
  Firestore,
} from 'firebase-admin/firestore';

import {
  getAuth,
  Auth,
} from 'firebase-admin/auth';

export const FIREBASE_CLIENTS = 'FIREBASE_CLIENTS';

export interface FirebaseClients {
  firestore: Firestore;
  auth: Auth;
}

export async function connectFirebase(
  config: ConfigService,
): Promise<FirebaseClients> {

  // 1. Read Firebase project ID
  const projectId =
    config.getOrThrow<string>('FIREBASE_PROJECT_ID');

  const clientEmail =
    config.get<string>('FIREBASE_CLIENT_EMAIL');

  const privateKey =
    config.get<string>('FIREBASE_PRIVATE_KEY');

  // 2. Validate credential configuration
  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new Error(
      'Both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be provided together',
    );
  }

  // 3. Select credential strategy
  // Local: existing service account credentials
  // Cloud Run: Application Default Credentials

  const credential =
    clientEmail && privateKey
      ? cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      : applicationDefault();

  // 4. Initialize Firebase Admin once
  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential,
        projectId,
      });

  // 5. Initialize Firebase services
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  // 6. Verify actual Firestore connectivity
  await firestore
    .doc('_internal/startup-check')
    .get();

  console.log('Firebase connected successfully');

  return {
    firestore,
    auth,
  };
}