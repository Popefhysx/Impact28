import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import { StaffCategory } from '@prisma/client';
import { InviteStaffDto, UpdateStaffDto } from './dto';
import {
  CAPABILITY_TEMPLATES,
  CAPABILITY_GROUPS,
  CapabilityTemplateId,
} from './capabilities';
import * as crypto from 'crypto';

/**
 * Staff Management Service
 *
 * Manages the 3-category RBAC system:
 * - ADMIN: Can change the system
 * - STAFF: Can execute assigned work
 * - OBSERVER: Read-only access
 *
 * Handles staff invites, capability assignment, and scope management.
 */
@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) { }

  /**
   * Invite a new staff member
   * Creates a User record if needed, then creates Staff record with invite token
   */
  async inviteStaff(dto: InviteStaffDto, invitedById: string) {
    // Check if email already has a staff record
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        user: { email: dto.email },
      },
    });

    if (existingStaff) {
      throw new ConflictException(
        'A staff member with this email already exists',
      );
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Create a new user record for the staff member
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName || 'Pending',
          lastName: dto.lastName || 'Setup',
        },
      });
    }

    // Determine capabilities based on category and template
    let capabilities: string[] = [];

    if (dto.category === 'ADMIN') {
      // ADMIN gets all capabilities automatically
      capabilities = Object.values(CAPABILITIES);
    } else if (dto.templateId && dto.templateId in CAPABILITY_TEMPLATES) {
      // STAFF/OBSERVER: resolve from template
      capabilities = [
        ...CAPABILITY_TEMPLATES[dto.templateId as CapabilityTemplateId]
          .capabilities,
      ];
    }
    if (dto.capabilities && dto.capabilities.length > 0) {
      // Merge with any custom capabilities
      capabilities = [...new Set([...capabilities, ...dto.capabilities])];
    }

    // Generate secure invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create staff record
    const staff = await this.prisma.staff.create({
      data: {
        userId: user.id,
        category: dto.category,
        capabilities,
        cohortIds: dto.cohortIds || [],
        queueIds: [],
        participantIds: [],
        invitedBy: invitedById,
        inviteToken,
        inviteTokenExpiresAt,
        setupCompleted: false,
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`Staff member invited: ${dto.email} as ${dto.category}`);

    // Get inviter's name for the email
    let inviterName: string | undefined;
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { firstName: true, lastName: true },
    });
    if (inviter) {
      inviterName = `${inviter.firstName} ${inviter.lastName}`.trim();
    }

    // Generate setup link with secure token
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${baseUrl}/admin/setup/${inviteToken}`;

    // Send invite email
    await this.emailService.sendStaffInvite(dto.email, {
      category: dto.category,
      inviterName,
      setupLink,
    });

    return staff;
  }

  /**
   * Get all staff members with optional filtering
   */
  async getStaffMembers(options?: {
    category?: StaffCategory;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      category,
      isActive = true,
      search,
      limit = 50,
      offset = 0,
    } = options || {};

    const where: any = {
      isActive,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        select: {
          id: true,
          category: true,
          isSuperAdmin: true,
          capabilities: true,
          cohortIds: true,
          isActive: true,
          invitedAt: true,
          setupCompleted: true,
          inviteTokenExpiresAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              lastLoginAt: true,
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.staff.count({ where }),
    ]);

    return { staff, total };
  }

  /**
   * Get detailed staff member information
   */
  async getStaffDetail(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Get assigned cohort details
    let assignedCohorts: any[] = [];
    if (staff.cohortIds.length > 0) {
      assignedCohorts = await this.prisma.cohort.findMany({
        where: { id: { in: staff.cohortIds } },
        select: { id: true, name: true, isActive: true },
      });
    }

    return {
      ...staff,
      assignedCohorts,
    };
  }

  /**
   * Update staff member capabilities and scope
   */
  async updateStaff(staffId: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!existing) {
      throw new NotFoundException('Staff member not found');
    }

    // Validate super admin changes
    if (
      dto.isSuperAdmin !== undefined &&
      dto.isSuperAdmin &&
      existing.category !== StaffCategory.ADMIN
    ) {
      throw new BadRequestException(
        'Only ADMIN category staff can be super admins',
      );
    }

    const updated = await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        ...(dto.category && { category: dto.category }),
        ...(dto.capabilities && { capabilities: dto.capabilities }),
        ...(dto.cohortIds && { cohortIds: dto.cohortIds }),
        ...(dto.queueIds && { queueIds: dto.queueIds }),
        ...(dto.participantIds && { participantIds: dto.participantIds }),
        ...(dto.isSuperAdmin !== undefined && {
          isSuperAdmin: dto.isSuperAdmin,
        }),
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`Staff member updated: ${updated.user.email}`);

    return updated;
  }

  /**
   * Deactivate a staff member (soft delete)
   */
  async deactivateStaff(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Prevent deactivating super admins
    if (staff.isSuperAdmin) {
      throw new BadRequestException('Cannot deactivate a super admin');
    }

    const updated = await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    this.logger.log(`Staff member deactivated: ${staff.user.email}`);

    return updated;
  }

  /**
   * Reactivate a deactivated staff member
   */
  async reactivateStaff(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const updated = await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
      include: { user: true },
    });

    this.logger.log(`Staff member reactivated: ${updated.user.email}`);

    return updated;
  }

  /**
   * Get capability templates for the UI
   */
  getCapabilityTemplates() {
    return {
      templates: Object.entries(CAPABILITY_TEMPLATES).map(([id, template]) => ({
        id,
        ...template,
      })),
      groups: CAPABILITY_GROUPS,
    };
  }

  /**
   * Get all available cohorts for scope assignment
   */
  async getAvailableCohorts() {
    return this.prisma.cohort.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Check if a user has a specific capability
   */
  async hasCapability(userId: string, capability: string): Promise<boolean> {
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
    });

    if (!staff || !staff.isActive) {
      return false;
    }

    // Super admins have all capabilities
    if (staff.isSuperAdmin) {
      return true;
    }

    return staff.capabilities.includes(capability);
  }

  /**
   * Check if a user has access to a specific cohort
   */
  async hasCohortAccess(userId: string, cohortId: string): Promise<boolean> {
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
    });

    if (!staff || !staff.isActive) {
      return false;
    }

    // Super admins and ADMINs have access to all cohorts
    if (staff.isSuperAdmin || staff.category === StaffCategory.ADMIN) {
      return true;
    }

    return staff.cohortIds.includes(cohortId);
  }

  /**
   * Resend invite email with a fresh token
   */
  async resendInvite(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (staff.setupCompleted) {
      throw new BadRequestException('This staff member has already completed setup');
    }

    // Generate a fresh invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        inviteToken,
        inviteTokenExpiresAt,
      },
    });

    // Generate setup link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${baseUrl}/admin/setup/${inviteToken}`;

    // Resend the email
    await this.emailService.sendStaffInvite(staff.user.email, {
      category: staff.category,
      setupLink,
    });

    this.logger.log(`Invite resent for staff ${staff.user.email}`);

    return {
      success: true,
      message: 'Invite email resent successfully',
      expiresAt: inviteTokenExpiresAt,
    };
  }

  /**
   * Validate an invite token (for frontend pre-check)
   */
  async validateInviteToken(token: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { inviteToken: token },
      include: {
        user: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    if (staff.setupCompleted) {
      throw new BadRequestException('This invite has already been used');
    }

    if (staff.inviteTokenExpiresAt && new Date() > staff.inviteTokenExpiresAt) {
      throw new BadRequestException(
        'Invite has expired. Please contact an admin.',
      );
    }

    return {
      valid: true,
      email: staff.user.email,
      category: staff.category,
      capabilities: staff.capabilities,
    };
  }

  /**
   * Accept an invite and set up credentials
   */
  async acceptInvite(
    token: string,
    firstName: string,
    lastName: string,
    username: string,
    pin: string,
  ) {
    const bcrypt = await import('bcrypt');

    const staff = await this.prisma.staff.findUnique({
      where: { inviteToken: token },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    if (staff.setupCompleted) {
      throw new BadRequestException('This invite has already been used');
    }

    if (staff.inviteTokenExpiresAt && new Date() > staff.inviteTokenExpiresAt) {
      throw new BadRequestException(
        'Invite has expired. Please contact an admin.',
      );
    }

    // Validate username format
    const normalizedUsername = username.toLowerCase().trim();
    if (!/^[a-z][a-z0-9._]{2,}$/.test(normalizedUsername)) {
      throw new BadRequestException(
        'Username must start with a letter and contain only lowercase letters, numbers, dots, and underscores (min 3 characters)',
      );
    }

    // Check username uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Username is already taken. Please choose a different one.',
      );
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update user record with credentials
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
        pin: hashedPin,
      },
    });

    // Mark invite as completed
    await this.prisma.staff.update({
      where: { id: staff.id },
      data: {
        setupCompleted: true,
        inviteToken: null, // Clear the token
      },
    });

    this.logger.log(`Staff member ${normalizedUsername} completed setup`);

    // Notify admin that staff completed setup (async, non-blocking)
    if (staff.invitedBy && staff.invitedBy !== 'system') {
      this.notifyAdminOfSetupComplete(staff.invitedBy, `${firstName} ${lastName}`, staff.user.email)
        .catch((err: Error) => this.logger.error(`Failed to notify admin of setup: ${err.message}`));
    }

    return {
      success: true,
      message: 'Account setup complete. You can now log in.',
      username: normalizedUsername,
    };
  }

  /**
   * Notify the inviting admin that a staff member completed setup
   */
  private async notifyAdminOfSetupComplete(inviterUserId: string, staffName: string, staffEmail: string) {
    try {
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        select: { email: true, firstName: true },
      });

      if (!inviter) return;

      // TODO: Create in-app notification when Notification model is added to schema
      this.logger.log(`Admin ${inviter.email} notified: ${staffName} (${staffEmail}) completed setup`);
    } catch (error) {
      this.logger.error(`Failed to notify admin: ${error}`);
    }
  }
}
