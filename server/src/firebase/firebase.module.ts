import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  connectFirebase,
  FIREBASE_CLIENTS,
} from '../config/firebase.config';

import { FirebaseService } from './firebase.service';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_CLIENTS,

      inject: [ConfigService],

      useFactory: connectFirebase,
    },

    FirebaseService,
  ],

  exports: [FirebaseService],
})
export class FirebaseModule {}