import { Inject, Injectable } from '@nestjs/common';

import { FIREBASE_CLIENTS } from '../config/firebase.config';
import type { FirebaseClients } from '../config/firebase.config';

import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService {
  constructor(
    @Inject(FIREBASE_CLIENTS)
    private readonly clients: FirebaseClients,
  ) {}

  get firestore(): Firestore {
    return this.clients.firestore;
  }

  get auth(): Auth {
    return this.clients.auth;
  }
}