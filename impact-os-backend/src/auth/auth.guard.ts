/**
 * Auth Guard
 *
 * Simple authentication guard that checks for valid user token.
 * For basic authenticated endpoints (not staff-specific).
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

interface TokenPayload {
  userId: string;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // Extract token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    // Verify and decode JWT token
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Get user by extracted userId
    try {
      const user = await this.authService.getCurrentUser(payload.userId);
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('User not found or inactive');
    }
  }
}
