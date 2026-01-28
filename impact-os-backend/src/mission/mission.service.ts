import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import { MissionStatus, SkillDomain, Difficulty, IdentityLevel } from '@prisma/client';

/**
 * Mission Service
 * 
 * Handles the Impact OS mission system:
 * 1. Daily/weekly mission generation
 * 2. Mission assignment to users
 * 3. Proof submission and verification
 * 4. Reward distribution on completion
 */

interface CreateMissionDto {
    title: string;
    description: string;
    skillDomain: SkillDomain;
    difficulty: Difficulty;
    momentum?: number;
    skillXp?: number;
    arenaPoints?: number;
    requiredLevel?: IdentityLevel;
    isDaily?: boolean;
    isWeekly?: boolean;
}

interface CompleteMissionDto {
    proofUrl?: string;
    proofText?: string;
}

@Injectable()
export class MissionService {
    private readonly logger = new Logger(MissionService.name);

    constructor(
        private prisma: PrismaService,
        private currencyService: CurrencyService,
    ) { }

    // ===== MISSION TEMPLATES =====

    /**
     * Create a new mission template
     */
    async createMission(dto: CreateMissionDto) {
        return this.prisma.mission.create({
            data: {
                title: dto.title,
                description: dto.description,
                skillDomain: dto.skillDomain,
                difficulty: dto.difficulty,
                momentum: dto.momentum || 10,
                skillXp: dto.skillXp || 5,
                arenaPoints: dto.arenaPoints || 0,
                requiredLevel: dto.requiredLevel || IdentityLevel.L1_ACTIVATED,
                isDaily: dto.isDaily || false,
                isWeekly: dto.isWeekly || false,
            },
        });
    }

    /**
     * Get available missions for a user's level
     */
    async getAvailableMissions(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { identityLevel: true },
        });

        if (!user) throw new NotFoundException('User not found');

        const levelOrder = [
            IdentityLevel.L0_APPLICANT,
            IdentityLevel.L1_ACTIVATED,
            IdentityLevel.L2_SKILLED,
            IdentityLevel.L3_EXPOSED,
            IdentityLevel.L4_EARNER,
            IdentityLevel.L5_CATALYST,
        ];

        const userLevelIndex = levelOrder.indexOf(user.identityLevel);
        const accessibleLevels = levelOrder.slice(0, userLevelIndex + 1);

        return this.prisma.mission.findMany({
            where: {
                isActive: true,
                requiredLevel: { in: accessibleLevels },
            },
            orderBy: [{ difficulty: 'asc' }, { createdAt: 'desc' }],
        });
    }

    // ===== MISSION ASSIGNMENTS =====

    /**
     * Assign a mission to a user
     */
    async assignMission(
        userId: string,
        missionId: string,
        deadlineDays: number = 7,
    ) {
        // Check if already assigned
        const existing = await this.prisma.missionAssignment.findFirst({
            where: {
                userId,
                missionId,
                status: { in: [MissionStatus.ASSIGNED, MissionStatus.IN_PROGRESS] },
            },
        });

        if (existing) {
            throw new BadRequestException('Mission already assigned');
        }

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + deadlineDays);

        return this.prisma.missionAssignment.create({
            data: {
                userId,
                missionId,
                status: MissionStatus.ASSIGNED,
                deadlineAt: deadline,
            },
            include: { mission: true },
        });
    }

    /**
     * Start a mission (user begins working on it)
     */
    async startMission(userId: string, assignmentId: string) {
        const assignment = await this.prisma.missionAssignment.findFirst({
            where: {
                id: assignmentId,
                userId,
                status: MissionStatus.ASSIGNED,
            },
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found or already started');
        }

        return this.prisma.missionAssignment.update({
            where: { id: assignmentId },
            data: {
                status: MissionStatus.IN_PROGRESS,
                startedAt: new Date(),
            },
        });
    }

    /**
     * Submit mission completion
     */
    async submitMission(
        userId: string,
        assignmentId: string,
        dto: CompleteMissionDto,
    ) {
        const assignment = await this.prisma.missionAssignment.findFirst({
            where: {
                id: assignmentId,
                userId,
                status: MissionStatus.IN_PROGRESS,
            },
            include: { mission: true },
        });

        if (!assignment) {
            throw new NotFoundException('Active assignment not found');
        }

        // Check deadline
        if (assignment.deadlineAt && new Date() > assignment.deadlineAt) {
            await this.prisma.missionAssignment.update({
                where: { id: assignmentId },
                data: { status: MissionStatus.EXPIRED },
            });
            throw new BadRequestException('Mission deadline has passed');
        }

        // Mark as pending review (or auto-complete for simple missions)
        const needsReview = assignment.mission.difficulty !== Difficulty.EASY;

        if (needsReview) {
            return this.prisma.missionAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: MissionStatus.SUBMITTED,
                    proofUrl: dto.proofUrl,
                    proofText: dto.proofText,
                    completedAt: new Date(),
                },
            });
        }

        // Auto-complete for beginner missions
        return this.completeMission(userId, assignmentId);
    }

    /**
     * Complete mission and distribute rewards
     */
    async completeMission(
        userId: string,
        assignmentId: string,
        adminApproval = false,
    ) {
        const assignment = await this.prisma.missionAssignment.findFirst({
            where: {
                id: assignmentId,
                userId,
                status: { in: [MissionStatus.IN_PROGRESS, MissionStatus.SUBMITTED] },
            },
            include: { mission: true },
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        // Update status
        await this.prisma.missionAssignment.update({
            where: { id: assignmentId },
            data: {
                status: MissionStatus.VERIFIED,
                completedAt: new Date(),
            },
        });

        // Distribute rewards
        await this.currencyService.rewardMission(
            userId,
            assignment.missionId,
            {
                momentum: assignment.mission.momentum,
                skillXp: assignment.mission.skillXp,
                arenaPoints: assignment.mission.arenaPoints,
            },
        );

        this.logger.log(`Mission ${assignment.missionId} completed by ${userId}`);

        return {
            success: true,
            rewards: {
                momentum: assignment.mission.momentum,
                skillXp: assignment.mission.skillXp,
                arenaPoints: assignment.mission.arenaPoints,
            },
        };
    }

    /**
     * Get user's mission history
     */
    async getUserMissions(userId: string, status?: MissionStatus) {
        return this.prisma.missionAssignment.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            include: {
                mission: {
                    select: {
                        title: true,
                        description: true,
                        skillDomain: true,
                        difficulty: true,
                        momentum: true,
                        skillXp: true,
                        arenaPoints: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }

    /**
     * Get user's active missions
     */
    async getActiveMissions(userId: string) {
        return this.getUserMissions(userId, MissionStatus.IN_PROGRESS);
    }

    /**
     * Get user's mission stats
     */
    async getUserMissionStats(userId: string) {
        const stats = await this.prisma.missionAssignment.groupBy({
            by: ['status'],
            where: { userId },
            _count: true,
        });

        const result = {
            completed: 0,
            inProgress: 0,
            assigned: 0,
            expired: 0,
            failed: 0,
        };

        for (const stat of stats) {
            switch (stat.status) {
                case MissionStatus.VERIFIED:
                    result.completed = stat._count;
                    break;
                case MissionStatus.IN_PROGRESS:
                    result.inProgress = stat._count;
                    break;
                case MissionStatus.ASSIGNED:
                    result.assigned = stat._count;
                    break;
                case MissionStatus.EXPIRED:
                    result.expired = stat._count;
                    break;
                case MissionStatus.FAILED:
                    result.failed = stat._count;
                    break;
            }
        }

        return result;
    }

    // ===== ADMIN FUNCTIONS =====

    /**
     * Get missions pending review
     */
    async getPendingReviews() {
        return this.prisma.missionAssignment.findMany({
            where: { status: MissionStatus.SUBMITTED },
            include: {
                mission: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { completedAt: 'asc' },
        });
    }

    /**
     * Admin: Approve mission
     */
    async approveMission(assignmentId: string) {
        const assignment = await this.prisma.missionAssignment.findUnique({
            where: { id: assignmentId },
            select: { userId: true, status: true },
        });

        if (!assignment || assignment.status !== MissionStatus.SUBMITTED) {
            throw new NotFoundException('Pending assignment not found');
        }

        return this.completeMission(assignment.userId, assignmentId, true);
    }

    /**
     * Admin: Fail mission
     */
    async failMission(assignmentId: string, reason: string) {
        return this.prisma.missionAssignment.update({
            where: { id: assignmentId },
            data: { status: MissionStatus.FAILED },
        });
    }

    // ===== DAILY/WEEKLY MISSIONS =====

    /**
     * Assign daily missions to active users
     * Called by cron job
     */
    async assignDailyMissions(): Promise<number> {
        const dailyMissions = await this.prisma.mission.findMany({
            where: { isDaily: true, isActive: true },
        });

        if (dailyMissions.length === 0) return 0;

        const activeUsers = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, identityLevel: true },
        });

        let assignmentCount = 0;

        for (const user of activeUsers) {
            // Pick a random daily mission appropriate for their level
            const eligibleMissions = dailyMissions.filter(m => {
                const levelOrder = Object.values(IdentityLevel);
                return levelOrder.indexOf(m.requiredLevel) <= levelOrder.indexOf(user.identityLevel);
            });

            if (eligibleMissions.length === 0) continue;

            const randomMission = eligibleMissions[Math.floor(Math.random() * eligibleMissions.length)];

            try {
                await this.assignMission(user.id, randomMission.id, 1); // 1 day deadline
                assignmentCount++;
            } catch (error) {
                // Already assigned, skip
            }
        }

        this.logger.log(`Assigned ${assignmentCount} daily missions`);
        return assignmentCount;
    }
}
