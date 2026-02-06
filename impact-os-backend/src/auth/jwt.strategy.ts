import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_SECRET') ||
        'impact-os-dev-secret-change-in-prod',
    });
  }

  /**
   * Validates JWT payload and returns full user object.
   * This becomes request.user in controllers.
   */
  async validate(payload: { userId: string; email: string }) {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch full user from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        identityLevel: true,
        skillTrack: true,
        avatarUrl: true,
        isActive: true,
        cohort: { select: { id: true, name: true } },
        applicant: {
          select: {
            triadTechnical: true,
            triadSoft: true,
            triadCommercial: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is paused');
    }

    return user;
  }
}

