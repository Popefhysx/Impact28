import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import { StaffCategory } from '@prisma/client';
import { InviteStaffDto, UpdateStaffDto } from './dto';
import { CAPABILITY_TEMPLATES, CAPABILITY_GROUPS, CapabilityTemplateId } from './capabilities';

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
     * Creates a User record if needed, then creates Staff record
     */
    async inviteStaff(dto: InviteStaffDto, invitedById: string) {
        // Check if email already has a staff record
        const existingStaff = await this.prisma.staff.findFirst({
            where: {
                user: { email: dto.email },
            },
        });

        if (existingStaff) {
            throw new ConflictException('A staff member with this email already exists');
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
                    firstName: 'Pending',
                    lastName: 'Setup',
                },
            });
        }

        // Determine capabilities from template or custom list
        let capabilities: string[] = [];
        if (dto.templateId && dto.templateId in CAPABILITY_TEMPLATES) {
            capabilities = [...CAPABILITY_TEMPLATES[dto.templateId as CapabilityTemplateId].capabilities];
        }
        if (dto.capabilities && dto.capabilities.length > 0) {
            // Merge with any custom capabilities
            capabilities = [...new Set([...capabilities, ...dto.capabilities])];
        }

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

        // Generate setup link (in production, this would be a magic link or token-based URL)
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const setupLink = `${baseUrl}/staff/setup?token=${staff.id}`;

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
        const { category, isActive = true, search, limit = 50, offset = 0 } = options || {};

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
                include: {
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
        if (dto.isSuperAdmin !== undefined && dto.isSuperAdmin && existing.category !== StaffCategory.ADMIN) {
            throw new BadRequestException('Only ADMIN category staff can be super admins');
        }

        const updated = await this.prisma.staff.update({
            where: { id: staffId },
            data: {
                ...(dto.category && { category: dto.category }),
                ...(dto.capabilities && { capabilities: dto.capabilities }),
                ...(dto.cohortIds && { cohortIds: dto.cohortIds }),
                ...(dto.queueIds && { queueIds: dto.queueIds }),
                ...(dto.participantIds && { participantIds: dto.participantIds }),
                ...(dto.isSuperAdmin !== undefined && { isSuperAdmin: dto.isSuperAdmin }),
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
}
