import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async login(idToken: string) {
    let uid: string;

    try {
      const decoded = await this.firebase.auth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    const { user, isNewUser } =
      await this.usersService.findOrCreate(uid);

    return {
      success: true,
      isNewUser,
      user,
    };
  }
}