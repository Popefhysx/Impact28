import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Uses Passport's JWT strategy to authenticate requests.
 * Attaches full user object to request.user via JwtStrategy.validate()
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
