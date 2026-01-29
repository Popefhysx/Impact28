import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AdmissionService } from '../admission';
import { ApplicantStatus, IdentityLevel, VerificationStatus, MissionStatus } from '@prisma/client';

/**
 * Admin Dashboard Service
 * 
 * Provides overview statistics and management functions for the Impact OS admin.
 */

export interface DashboardStats {
    applicants: {
        total: number;
        pending: number;
        admitted: number;
        conditional: number;
        rejected: number;
        scoring: number;
    };
    users: {
        total: number;
        active: number;
        paused: number;
        byLevel: Record<string, number>;
    };
    income: {
        pendingReviews: number;
        totalVerifiedUSD: number;
        totalRecords: number;
    };
    missions: {
        pendingReviews: number;
        completedToday: number;
        activeAssignments: number;
    };
}

export interface RecentActivity {
    type: 'application' | 'income' | 'mission' | 'level_up';
    userId?: string;
    applicantId?: string;
    description: string;
    timestamp: Date;
}

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private prisma: PrismaService,
        private admissionService: AdmissionService,
    ) { }

    /**
     * Get comprehensive dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const [
            applicantStats,
            userStats,
            incomeStats,
            missionStats,
        ] = await Promise.all([
            this.getApplicantStats(),
            this.getUserStats(),
            this.getIncomeStats(),
            this.getMissionStats(),
        ]);

        return {
            applicants: applicantStats,
            users: userStats,
            income: incomeStats,
            missions: missionStats,
        };
    }

    /**
     * Get applicant statistics
     */
    private async getApplicantStats() {
        const stats = await this.prisma.applicant.groupBy({
            by: ['status'],
            _count: true,
        });

        const result = {
            total: 0,
            pending: 0,
            admitted: 0,
            conditional: 0,
            rejected: 0,
            scoring: 0,
        };

        for (const stat of stats) {
            result.total += stat._count;
            switch (stat.status) {
                case ApplicantStatus.PENDING:
                    result.pending = stat._count;
                    break;
                case ApplicantStatus.ADMITTED:
                    result.admitted = stat._count;
                    break;
                case ApplicantStatus.CONDITIONAL:
                    result.conditional = stat._count;
                    break;
                case ApplicantStatus.REJECTED:
                    result.rejected = stat._count;
                    break;
                case ApplicantStatus.SCORING:
                    result.scoring = stat._count;
                    break;
            }
        }

        return result;
    }

    /**
     * Get user statistics
     */
    private async getUserStats() {
        const [levelStats, activeCount, pausedCount] = await Promise.all([
            this.prisma.user.groupBy({
                by: ['identityLevel'],
                _count: true,
            }),
            this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.user.count({ where: { isActive: false } }),
        ]);

        const byLevel: Record<string, number> = {};
        let total = 0;

        for (const stat of levelStats) {
            byLevel[stat.identityLevel] = stat._count;
            total += stat._count;
        }

        return {
            total,
            active: activeCount,
            paused: pausedCount,
            byLevel,
        };
    }

    /**
     * Get income verification statistics
     */
    private async getIncomeStats() {
        const [pendingCount, verifiedSum, totalCount] = await Promise.all([
            this.prisma.incomeRecord.count({
                where: { status: VerificationStatus.SUBMITTED },
            }),
            this.prisma.incomeRecord.aggregate({
                where: { status: VerificationStatus.VERIFIED },
                _sum: { amountUSD: true },
            }),
            this.prisma.incomeRecord.count(),
        ]);

        return {
            pendingReviews: pendingCount,
            totalVerifiedUSD: verifiedSum._sum.amountUSD?.toNumber() || 0,
            totalRecords: totalCount,
        };
    }

    /**
     * Get mission statistics
     */
    private async getMissionStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingCount, completedToday, activeCount] = await Promise.all([
            this.prisma.missionAssignment.count({
                where: { status: MissionStatus.SUBMITTED },
            }),
            this.prisma.missionAssignment.count({
                where: {
                    status: MissionStatus.VERIFIED,
                    completedAt: { gte: today },
                },
            }),
            this.prisma.missionAssignment.count({
                where: { status: MissionStatus.IN_PROGRESS },
            }),
        ]);

        return {
            pendingReviews: pendingCount,
            completedToday,
            activeAssignments: activeCount,
        };
    }

    /**
     * Get recent activity feed
     */
    async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
        const activities: RecentActivity[] = [];

        // Recent applications
        const recentApplicants = await this.prisma.applicant.findMany({
            where: { status: { in: [ApplicantStatus.PENDING, ApplicantStatus.ADMITTED] } },
            orderBy: { submittedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                status: true,
                submittedAt: true,
            },
        });

        for (const app of recentApplicants) {
            if (app.submittedAt) {
                activities.push({
                    type: 'application',
                    applicantId: app.id,
                    description: `${app.firstName} ${app.lastName} - ${app.status}`,
                    timestamp: app.submittedAt,
                });
            }
        }

        // Recent income verifications
        const recentIncome = await this.prisma.incomeRecord.findMany({
            where: { status: VerificationStatus.VERIFIED },
            orderBy: { verifiedAt: 'desc' },
            take: 10,
            select: {
                userId: true,
                amountUSD: true,
                verifiedAt: true,
                user: { select: { firstName: true, lastName: true } },
            },
        });

        for (const inc of recentIncome) {
            if (inc.verifiedAt) {
                activities.push({
                    type: 'income',
                    userId: inc.userId,
                    description: `${inc.user.firstName} verified $${inc.amountUSD?.toNumber() || 0}`,
                    timestamp: inc.verifiedAt,
                });
            }
        }

        // Recent mission completions
        const recentMissions = await this.prisma.missionAssignment.findMany({
            where: { status: MissionStatus.VERIFIED },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                userId: true,
                completedAt: true,
                mission: { select: { title: true } },
                user: { select: { firstName: true, lastName: true } },
            },
        });

        for (const m of recentMissions) {
            if (m.completedAt) {
                activities.push({
                    type: 'mission',
                    userId: m.userId,
                    description: `${m.user.firstName} completed "${m.mission.title}"`,
                    timestamp: m.completedAt,
                });
            }
        }

        // Sort by timestamp and limit
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get all applicants with filtering
     */
    async getApplicants(options: {
        status?: ApplicantStatus;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const { status, search, limit = 50, offset = 0 } = options;

        return this.prisma.applicant.findMany({
            where: {
                ...(status && { status }),
                ...(search && {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { startedAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                skillTrack: true,
                readinessScore: true,
                aiRecommendation: true,
                startedAt: true,
                submittedAt: true,
            },
        });
    }

    /**
     * Get all users with filtering
     */
    async getUsers(options: {
        level?: IdentityLevel;
        isActive?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const { level, isActive, search, limit = 50, offset = 0 } = options;

        return this.prisma.user.findMany({
            where: {
                ...(level && { identityLevel: level }),
                ...(isActive !== undefined && { isActive }),
                ...(search && {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                identityLevel: true,
                isActive: true,
                pausedAt: true,
                pauseReason: true,
                createdAt: true,
            },
        });
    }

    /**
     * Get detailed user profile for admin
     */
    async getUserDetail(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                applicant: {
                    select: {
                        id: true,
                        skillTrack: true,
                        readinessScore: true,
                        diagnosticReport: true,
                        startedAt: true,
                    },
                },
                currencyLedger: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                missions: {
                    include: { mission: true },
                    orderBy: { assignedAt: 'desc' },
                    take: 10,
                },
                incomeRecords: {
                    orderBy: { earnedAt: 'desc' },
                    take: 10,
                },
            },
        });
    }

    /**
     * Manually update applicant status
     */
    async updateApplicantStatus(applicantId: string, status: ApplicantStatus) {
        return this.prisma.applicant.update({
            where: { id: applicantId },
            data: { status },
        });
    }

    /**
     * Manually update user level
     */
    async updateUserLevel(userId: string, level: IdentityLevel) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { identityLevel: level },
        });
    }

    /**
     * Force reactivate a user
     */
    async reactivateUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: true,
                pausedAt: null,
                pauseReason: null,
            },
        });
    }

    /**
     * Get detailed applicant information for admin review
     */
    async getApplicantDetail(applicantId: string) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
            include: {
                conditionalTasks: true,
            },
        });

        if (!applicant) {
            throw new Error(`Applicant ${applicantId} not found`);
        }

        return {
            // Basic Info
            id: applicant.id,
            email: applicant.email,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            whatsapp: applicant.whatsapp,

            // Location & Demographics
            country: applicant.country,
            state: applicant.state,
            age: applicant.age,
            gender: applicant.gender,
            source: applicant.source,

            // Current Situation
            currentStatus: applicant.currentStatus,
            educationLevel: applicant.educationLevel,
            biggestChallenge: applicant.biggestChallenge,

            // Resources
            hasInternet: applicant.hasInternet,
            weeklyHours: applicant.weeklyHours,
            primaryDevice: applicant.primaryDevice,

            // Skills & Track
            skillTrack: applicant.skillTrack,
            triedOnlineEarning: applicant.triedOnlineEarning,
            onlineEarningOutcome: applicant.onlineEarningOutcome,
            triedLearningSkill: applicant.triedLearningSkill,

            // Income Context
            incomeRange: applicant.incomeRange,
            intakeIncomeSource: applicant.intakeIncomeSource,

            // Probes (Free-form responses)
            technicalProbe: applicant.technicalProbe,
            commercialProbe: applicant.commercialProbe,
            exposureProbe: applicant.exposureProbe,
            commitmentProbe: applicant.commitmentProbe,

            // AI Diagnostics
            readinessScore: applicant.readinessScore,
            actionOrientation: applicant.actionOrientation,
            marketAwareness: applicant.marketAwareness,
            rejectionResilience: applicant.rejectionResilience,
            commitmentSignal: applicant.commitmentSignal,
            diagnosticReport: applicant.diagnosticReport,
            riskFlags: applicant.riskFlags,
            aiRecommendation: applicant.aiRecommendation,

            // Skill Triad
            triadTechnical: applicant.triadTechnical,
            triadSoft: applicant.triadSoft,
            triadCommercial: applicant.triadCommercial,

            // Offer Details
            offerType: applicant.offerType,
            receivesStipend: applicant.receivesStipend,
            primaryFocus: applicant.primaryFocus,
            kpiTargets: applicant.kpiTargets,

            // Status & Timeline
            status: applicant.status,
            completedSections: applicant.completedSections,
            startedAt: applicant.startedAt,
            submittedAt: applicant.submittedAt,
            reviewedAt: applicant.reviewedAt,
            reviewedBy: applicant.reviewedBy,
            rejectionReason: applicant.rejectionReason,

            // Consent
            consentDailyAction: applicant.consentDailyAction,
            consentWeeklyCheckin: applicant.consentWeeklyCheckin,
            consentFailure: applicant.consentFailure,
            consentData: applicant.consentData,

            // Conditional Tasks
            conditionalTasks: applicant.conditionalTasks,
        };
    }

    /**
     * Make admission decision for an applicant
     */
    async makeAdmissionDecision(
        applicantId: string,
        decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
        notes?: string,
    ) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
        });

        if (!applicant) {
            throw new Error(`Applicant ${applicantId} not found`);
        }

        // Map decision to status
        const statusMap: Record<string, ApplicantStatus> = {
            'ADMITTED': ApplicantStatus.ADMITTED,
            'CONDITIONAL': ApplicantStatus.CONDITIONAL,
            'REJECTED': ApplicantStatus.REJECTED,
        };

        const status = statusMap[decision];

        // Update applicant with decision
        const updated = await this.prisma.applicant.update({
            where: { id: applicantId },
            data: {
                status,
                reviewedAt: new Date(),
                reviewedBy: 'admin', // TODO: Use actual admin ID
                ...(notes && { diagnosticReport: { ...applicant.diagnosticReport as object, adminNotes: notes } }),
            },
        });

        this.logger.log(`Applicant ${applicantId} decision: ${decision}`);

        // Trigger email sending via AdmissionService
        try {
            await this.admissionService.processAdmission(applicantId);
            this.logger.log(`Admission email sent for ${applicantId}`);
        } catch (error) {
            this.logger.error(`Failed to send admission email: ${error}`);
        }

        return {
            success: true,
            applicantId,
            decision,
            status: updated.status,
            message: `Applicant has been ${decision.toLowerCase()}`,
        };
    }
}
