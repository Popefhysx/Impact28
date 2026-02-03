/**
 * Capability Guard Decorator
 *
 * NestJS guard that checks if the current user has the required capability.
 * Use with @RequireCapability('capability.name') decorator.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const CAPABILITY_KEY = 'requiredCapability';
export const RequireCapability = (...capabilities: string[]) =>
  SetMetadata(CAPABILITY_KEY, capabilities);

// Staff category decorator for category-level access
export const CATEGORY_KEY = 'requiredCategory';
export const RequireCategory = (
  ...categories: ('ADMIN' | 'STAFF' | 'OBSERVER')[]
) => SetMetadata(CATEGORY_KEY, categories);

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCapabilities = this.reflector.getAllAndOverride<string[]>(
      CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredCategories = this.reflector.getAllAndOverride<string[]>(
      CATEGORY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no requirements, allow access
    if (!requiredCapabilities?.length && !requiredCategories?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.headers['x-user-id'];

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get staff record for the user
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
      select: {
        category: true,
        capabilities: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    if (!staff || !staff.isActive) {
      throw new ForbiddenException('Staff access required');
    }

    // Super admins bypass all capability checks
    if (staff.isSuperAdmin) {
      return true;
    }

    // Check category requirement
    if (requiredCategories?.length) {
      if (!requiredCategories.includes(staff.category)) {
        throw new ForbiddenException(
          `Access requires one of: ${requiredCategories.join(', ')}`,
        );
      }
    }

    // Check capability requirement (any of the listed capabilities)
    if (requiredCapabilities?.length) {
      const hasCapability = requiredCapabilities.some((cap) =>
        staff.capabilities.includes(cap),
      );
      if (!hasCapability) {
        throw new ForbiddenException(
          `Missing required capability: ${requiredCapabilities.join(' or ')}`,
        );
      }
    }

    return true;
  }
}

/**
 * Scope Guard
 *
 * Checks if staff has access to a specific cohort/participant.
 * Use after CapabilityGuard to filter scoped access.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.headers['x-user-id'];

    if (!userId) {
      return false;
    }

    const staff = await this.prisma.staff.findUnique({
      where: { userId },
      select: {
        cohortIds: true,
        participantIds: true,
        isSuperAdmin: true,
        category: true,
      },
    });

    if (!staff) {
      return false;
    }

    // Super admins and admins have full access
    if (staff.isSuperAdmin || staff.category === 'ADMIN') {
      return true;
    }

    // No scope restrictions = full access
    if (!staff.cohortIds.length && !staff.participantIds.length) {
      return true;
    }

    // Check if accessing a specific cohort
    const cohortId = request.params?.cohortId || request.query?.cohortId;
    if (cohortId && staff.cohortIds.length > 0) {
      if (!staff.cohortIds.includes(cohortId)) {
        throw new ForbiddenException('Access to this cohort is not permitted');
      }
    }

    // Check if accessing a specific participant
    const participantId =
      request.params?.participantId || request.query?.participantId;
    if (participantId && staff.participantIds.length > 0) {
      if (!staff.participantIds.includes(participantId)) {
        throw new ForbiddenException(
          'Access to this participant is not permitted',
        );
      }
    }

    // Attach staff scope to request for filtering queries
    request.staffScope = {
      cohortIds: staff.cohortIds,
      participantIds: staff.participantIds,
    };

    return true;
  }
}
