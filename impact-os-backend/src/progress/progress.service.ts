import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService, CurrencyBalance } from '../currency';
import { MissionService } from '../mission';
import { StipendService, StipendEligibility } from '../stipend';
import { MissionStatus, SkillDomain, CurrencyType } from '@prisma/client';

/**
 * Progress Service
 * 
 * Aggregates data from Currency, Mission, and Stipend services
 * to provide a unified dashboard view for participants.
 */

export interface DashboardProgress {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        identityLevel: string;
        skillTrack: string | null;
        daysInProgram: number;
        streak: number;
    };
    currencies: CurrencyBalance;
    stipend: StipendEligibility;
    missions: {
        active: number;
        completed: number;
        pending: number;
    };
    triad: {
        technical: number;
        soft: number;
        commercial: number;
    };
    kpiTargets: {
        weeklyXp: number;
        weeklyArena: number;
        incomeTarget: number;
    } | null;
}

export interface WeeklyStats {
    weekStart: Date;
    weekEnd: Date;
    xpEarned: number;
    arenaPoints: number;
    incomeVerified: number;
    missionsCompleted: number;
    avgMomentum: number;
}

@Injectable()
export class ProgressService {
    private readonly logger = new Logger(ProgressService.name);

    constructor(
        private prisma: PrismaService,
        private currencyService: CurrencyService,
        private missionService: MissionService,
        private stipendService: StipendService,
    ) { }

    /**
     * Get full dashboard progress for a user
     */
    async getDashboardProgress(userId: string): Promise<DashboardProgress> {
        // Fetch user with applicant data
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                applicant: {
                    select: {
                        triadTechnical: true,
                        triadSoft: true,
                        triadCommercial: true,
                        kpiTargets: true,
                    },
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get currency balances
        const currencies = await this.currencyService.getBalance(userId);

        // Get stipend eligibility
        const stipend = await this.stipendService.checkEligibility(userId);

        // Get mission stats
        const missionStats = await this.missionService.getUserMissionStats(userId);

        // Calculate days in program
        const daysInProgram = Math.floor(
            (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate streak (consecutive days with activity)
        const streak = await this.calculateStreak(userId);

        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                identityLevel: user.identityLevel,
                skillTrack: user.skillTrack,
                daysInProgram,
                streak,
            },
            currencies,
            stipend,
            missions: {
                active: missionStats.inProgress + missionStats.assigned,
                completed: missionStats.completed,
                pending: missionStats.assigned,
            },
            triad: {
                technical: user.applicant?.triadTechnical ?? 33,
                soft: user.applicant?.triadSoft ?? 33,
                commercial: user.applicant?.triadCommercial ?? 33,
            },
            kpiTargets: user.applicant?.kpiTargets as DashboardProgress['kpiTargets'] ?? null,
        };
    }

    /**
     * Calculate user's current streak (consecutive active days)
     */
    private async calculateStreak(userId: string): Promise<number> {
        // Get recent currency transactions to detect active days
        const recentActivity = await this.prisma.currencyLedger.findMany({
            where: {
                userId,
                amount: { gt: 0 }, // Only credits count
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        if (recentActivity.length === 0) return 0;

        // Group by date and count consecutive days
        const activeDays = new Set<string>();
        for (const entry of recentActivity) {
            activeDays.add(entry.createdAt.toISOString().split('T')[0]);
        }

        // Count streak from today backwards
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (activeDays.has(dateStr)) {
                streak++;
            } else if (i > 0) {
                // Allow today to be missing (day not over yet)
                break;
            }
        }

        return streak;
    }

    /**
     * Get weekly statistics for a user
     */
    async getWeeklyStats(userId: string): Promise<WeeklyStats> {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get currency transactions for this week
        const transactions = await this.prisma.currencyLedger.findMany({
            where: {
                userId,
                createdAt: {
                    gte: weekStart,
                    lt: weekEnd,
                },
                amount: { gt: 0 },
            },
        });

        // Aggregate by type
        let xpEarned = 0;
        let arenaPoints = 0;
        let incomeVerified = 0;

        for (const tx of transactions) {
            switch (tx.currencyType) {
                case 'SKILL_XP':
                    xpEarned += tx.amount;
                    break;
                case 'ARENA_POINTS':
                    arenaPoints += tx.amount;
                    break;
                case 'INCOME_PROOF':
                    incomeVerified += tx.amount;
                    break;
            }
        }

        // Count missions completed this week
        const missionsCompleted = await this.prisma.missionAssignment.count({
            where: {
                userId,
                status: MissionStatus.VERIFIED,
                completedAt: {
                    gte: weekStart,
                    lt: weekEnd,
                },
            },
        });

        // Get current momentum as proxy for avg
        const balance = await this.currencyService.getBalance(userId);

        return {
            weekStart,
            weekEnd,
            xpEarned,
            arenaPoints,
            incomeVerified,
            missionsCompleted,
            avgMomentum: balance.momentum,
        };
    }

    /**
     * Initialize progress for a newly converted user
     * Called after offer acceptance
     */
    async initializeProgress(userId: string): Promise<void> {
        this.logger.log(`Initializing progress for user ${userId}`);

        // Credit initial momentum to get them started
        await this.currencyService.credit(
            userId,
            CurrencyType.MOMENTUM,
            50, // Starting momentum
            'Welcome bonus: Program start',
        );

        // Assign initial missions based on skill track
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { skillTrack: true },
        });

        if (user?.skillTrack) {
            await this.assignStarterMissions(userId, user.skillTrack);
        }

        this.logger.log(`Progress initialized for user ${userId}`);
    }

    /**
     * Assign starter missions based on skill track
     */
    private async assignStarterMissions(userId: string, skillTrack: string): Promise<void> {
        // Find starter missions for this skill track
        const starterMissions = await this.prisma.mission.findMany({
            where: {
                OR: [
                    { skillDomain: SkillDomain.SOFT }, // Everyone gets soft skill missions
                    { skillDomain: this.mapSkillTrackToDomain(skillTrack) as SkillDomain },
                ],
                requiredLevel: 'L1_ACTIVATED',
                isActive: true,
            },
            take: 3,
        });

        // Assign each mission
        for (const mission of starterMissions) {
            try {
                await this.missionService.assignMission(userId, mission.id, 7);
            } catch (error) {
                this.logger.warn(`Failed to assign mission ${mission.id} to user ${userId}`);
            }
        }

        this.logger.log(`Assigned ${starterMissions.length} starter missions to user ${userId}`);
    }

    /**
     * Map skill track to skill domain for mission matching
     */
    private mapSkillTrackToDomain(skillTrack: string): string {
        const mapping: Record<string, string> = {
            'GRAPHIC_DESIGN': 'TECHNICAL',
            'WEB_DEVELOPMENT': 'TECHNICAL',
            'DIGITAL_MARKETING': 'COMMERCIAL',
            'VIDEO_EDITING': 'TECHNICAL',
            'VIRTUAL_ASSISTANT': 'SOFT',
            'DATA_ENTRY': 'TECHNICAL',
            'UI_UX_DESIGN': 'TECHNICAL',
            'COPYWRITING': 'COMMERCIAL',
            'SOCIAL_MEDIA': 'COMMERCIAL',
            'MUSIC_PRODUCTION': 'TECHNICAL',
        };

        return mapping[skillTrack] || 'SOFT';
    }

    /**
     * Get leaderboard for a cohort
     */
    async getCohortLeaderboard(cohortId: string, limit: number = 10) {
        // Get users in cohort with their currency balances
        const users = await this.prisma.user.findMany({
            where: {
                cohortId,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                identityLevel: true,
            },
        });

        // Get balances for each user
        const leaderboard = await Promise.all(
            users.map(async (user) => {
                const balance = await this.currencyService.getBalance(user.id);
                return {
                    userId: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    level: user.identityLevel,
                    momentum: balance.momentum,
                    xp: balance.skillXp,
                    totalScore: balance.momentum + balance.skillXp + balance.arenaPoints,
                };
            })
        );

        // Sort by total score
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);

        return leaderboard.slice(0, limit);
    }
}
