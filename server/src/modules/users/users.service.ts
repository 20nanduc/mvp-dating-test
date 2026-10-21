import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../../firebase/firebase.service';
import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { CreateAccountDto } from './dto/create_account_dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { getStorage } from 'firebase-admin/storage';
import { validateMatchPhotos } from '../../utils/validate-match-photos.util';


@Injectable()
export class UsersService {
  constructor(private readonly firebase: FirebaseService) { }

  async findOrCreate(uid: string) {
    const db = this.firebase.firestore;
    const userRef = db.collection('users').doc(uid);

    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);

      // Existing user
      if (snapshot.exists) {
        return {
          isNewUser: false,
          user: snapshot.data(),
        };
      }

      // New user
      const now = Timestamp.now();

      const user = {
        auth_id: uid,
        name: null,
        dob: null,
        state: null,
        gender: null,
        profile_pic: null,
        interests: [],
        isProfileCreated: false,
        isProfileShared: false,
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(userRef, user);

      return {
        isNewUser: true,
        user,
      };
    });
  }


  async createAccount(uid: string, dto: CreateAccountDto) {
    const db = this.firebase.firestore;

    // 1. Validate name
    const name = dto.fullName.trim();

    if (name.length < 2) {
      throw new BadRequestException('Invalid name');
    }

    // 2. Validate date of birth
    const dob = new Date(`${dto.dateOfBirth}T00:00:00Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.dateOfBirth) ||
      Number.isNaN(dob.getTime()) ||
      dob.toISOString().slice(0, 10) !== dto.dateOfBirth
    ) {
      throw new BadRequestException('Invalid date of birth');
    }

    // 3. Validate age >= 18
    const today = new Date();

    const cutoff = new Date(
      Date.UTC(
        today.getUTCFullYear() - 18,
        today.getUTCMonth(),
        today.getUTCDate(),
      ),
    );

    if (dob > cutoff) {
      throw new BadRequestException('You must be at least 18');
    }

    // 4. Reference existing user document
    const userRef = db.collection('users').doc(uid);

    // 5. Atomic update
    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        throw new NotFoundException('User not found');
      }

      // Prevent accidental overwrite on repeated requests
      if (userDoc.data()?.isProfileCreated === true) {
        return;
      }

      tx.update(userRef, {
        name,
        dob: dto.dateOfBirth,
        gender: dto.gender,
        state: dto.state,
        isProfileCreated: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // 6. Return updated user
    const updatedUser = await userRef.get();

    return {
      success: true,
      user: updatedUser.data(),
    };
  }


  async updateMatch(uid: string, dto: UpdateMatchDto) {

    // 1. Normalize and validate interests
    const interests = dto.interests.map((interest) =>
      interest.trim(),
    );

    if (interests.some((interest) => !interest)) {
      throw new BadRequestException(
        'Interests cannot be empty',
      );
    }

    const uniqueInterests = new Set(
      interests.map((interest) => interest.toLowerCase()),
    );

    if (uniqueInterests.size !== interests.length) {
      throw new BadRequestException(
        'Duplicate interests are not allowed',
      );
    }

    // 2. Validate uploaded photos
    await validateMatchPhotos(
      uid,
      dto.profile_pic,
      dto.profile_pic_thumb,
      process.env.FIREBASE_STORAGE_BUCKET ?? '',
    );

    // 3. Existing FirebaseService
    const db = this.firebase.firestore;

    const userRef = db.collection('users').doc(uid);

    // 4. Update the user document atomically
    await db.runTransaction(async (transaction: Transaction) => {

      const snapshot = await transaction.get(userRef);

      if (!snapshot.exists) {
        throw new NotFoundException('User not found');
      }

      const user = snapshot.data();

      // Account onboarding must be completed first
      if (!user?.isProfileCreated) {
        throw new ConflictException(
          'Complete account creation first',
        );
      }

      // First completion enables discovery.
      // Future edits preserve existing visibility.
      const isFirstSubmission = !user.profile_pic;

      transaction.update(userRef, {
        profile_pic: dto.profile_pic,

        profile_pic_thumb: dto.profile_pic_thumb,

        interests,

        isProfileShared: isFirstSubmission
          ? true
          : user.isProfileShared === true,

        updatedAt: FieldValue.serverTimestamp(),
      });

    });

    // 5. Fetch updated document
    const updated = await userRef.get();

    return {
      success: true,
      user: updated.data(),
    };
  }
}