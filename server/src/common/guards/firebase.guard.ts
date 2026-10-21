import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    const token = authorization?.match(/^Bearer (.+)$/i)?.[1];

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const decoded = await this.firebase.auth.verifyIdToken(token);

      request.user = { uid: decoded.uid };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}