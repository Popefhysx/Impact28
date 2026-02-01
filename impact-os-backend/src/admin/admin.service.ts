import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AdmissionService } from '../admission';
import { AssessmentService } from '../assessment';
import { ApplicantStatus, IdentityLevel, VerificationStatus, MissionStatus, SupportRequestStatus, SupportDenialReason } from '@prisma/client';

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

import { MissionEngineService } from '../mission/mission-engine.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private prisma: PrismaService,
        private admissionService: AdmissionService,
        private assessmentService: AssessmentService,
        private missionEngine: MissionEngineService,
    ) { }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            applicantStats,
            userStats,
            incomeStats,
            missionStats,
        ] = await Promise.all([
            // Applicant stats
            Promise.all([
                this.prisma.applicant.count(),
                this.prisma.applicant.count({ where: { status: ApplicantStatus.PENDING } }),
                this.prisma.applicant.count({ where: { status: ApplicantStatus.ADMITTED } }),
                this.prisma.applicant.count({ where: { status: ApplicantStatus.CONDITIONAL } }),
                this.prisma.applicant.count({ where: { status: ApplicantStatus.REJECTED } }),
                this.prisma.applicant.count({ where: { status: ApplicantStatus.SCORING } }),
            ]),
            // User stats
            Promise.all([
                this.prisma.user.count(),
                this.prisma.user.count({ where: { isActive: true } }),
                this.prisma.user.count({ where: { isActive: false } }),
                this.prisma.user.groupBy({
                    by: ['identityLevel'],
                    _count: true,
                }),
            ]),
            // Income stats
            Promise.all([
                this.prisma.incomeRecord.count({ where: { status: VerificationStatus.SUBMITTED } }),
                this.prisma.incomeRecord.aggregate({
                    where: { status: VerificationStatus.VERIFIED },
                    _sum: { amountUSD: true },
                }),
                this.prisma.incomeRecord.count(),
            ]),
            // Mission stats
            Promise.all([
                this.prisma.missionAssignment.count({ where: { status: MissionStatus.SUBMITTED } }),
                this.prisma.missionAssignment.count({ where: { status: MissionStatus.VERIFIED, completedAt: { gte: today } } }),
                this.prisma.missionAssignment.count({ where: { status: { in: [MissionStatus.ASSIGNED, MissionStatus.IN_PROGRESS] } } }),
            ]),
        ]);

        const byLevel: Record<string, number> = {};
        for (const level of userStats[3]) {
            byLevel[level.identityLevel] = level._count;
        }

        return {
            applicants: {
                total: applicantStats[0],
                pending: applicantStats[1],
                admitted: applicantStats[2],
                conditional: applicantStats[3],
                rejected: applicantStats[4],
                scoring: applicantStats[5],
            },
            users: {
                total: userStats[0],
                active: userStats[1],
                paused: userStats[2],
                byLevel,
            },
            income: {
                pendingReviews: incomeStats[0],
                totalVerifiedUSD: Number(incomeStats[1]._sum.amountUSD || 0),
                totalRecords: incomeStats[2],
            },
            missions: {
                pendingReviews: missionStats[0],
                completedToday: missionStats[1],
                activeAssignments: missionStats[2],
            },
        };
    }

    /**
     * Get recent activity for the dashboard
     */
    async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
        const activities: RecentActivity[] = [];

        // Get recent applications
        const recentApplicants = await this.prisma.applicant.findMany({
            where: { submittedAt: { not: null } },
            orderBy: { submittedAt: 'desc' },
            take: 5,
            select: { id: true, firstName: true, lastName: true, submittedAt: true },
        });

        for (const app of recentApplicants) {
            activities.push({
                type: 'application',
                applicantId: app.id,
                description: `${app.firstName} ${app.lastName} submitted application`,
                timestamp: app.submittedAt!,
            });
        }

        // Get recent missions
        const recentMissions = await this.prisma.missionAssignment.findMany({
            where: { status: MissionStatus.VERIFIED },
            orderBy: { completedAt: 'desc' },
            take: 5,
            include: { user: true, mission: true },
        });

        for (const mission of recentMissions) {
            activities.push({
                type: 'mission',
                userId: mission.userId,
                description: `${mission.user.firstName} completed "${mission.mission.title}"`,
                timestamp: mission.completedAt || new Date(),
            });
        }

        // Get recent income verifications
        const recentIncome = await this.prisma.incomeRecord.findMany({
            where: { status: VerificationStatus.VERIFIED },
            orderBy: { verifiedAt: 'desc' },
            take: 5,
            include: { user: true },
        });

        for (const income of recentIncome) {
            activities.push({
                type: 'income',
                userId: income.userId,
                description: `${income.user.firstName} income verified: $${Number(income.amountUSD || 0).toFixed(2)}`,
                timestamp: income.verifiedAt || new Date(),
            });
        }

        // Sort by timestamp and limit
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get applicants list with filtering
     */
    async getApplicants(options: {
        status?: ApplicantStatus;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const { status, search, limit = 50, offset = 0 } = options;

        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [applicants, total] = await Promise.all([
            this.prisma.applicant.findMany({
                where,
                orderBy: { submittedAt: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    readinessScore: true,
                    skillTrack: true,
                    submittedAt: true,
                    reviewedAt: true,
                },
            }),
            this.prisma.applicant.count({ where }),
        ]);

        return { applicants, total, limit, offset };
    }

    /**
     * Update applicant status
     */
    async updateApplicantStatus(applicantId: string, status: ApplicantStatus) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
        });

        if (!applicant) {
            throw new NotFoundException(`Applicant ${applicantId} not found`);
        }

        return this.prisma.applicant.update({
            where: { id: applicantId },
            data: {
                status,
                reviewedAt: new Date(),
            },
        });
    }

    /**
     * Get users list with filtering
     */
    async getUsers(options: {
        level?: IdentityLevel;
        isActive?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
    }) {
        const { level, isActive, search, limit = 50, offset = 0 } = options;

        const where: any = {};
        if (level) {
            where.identityLevel = level;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    identityLevel: true,
                    currentPhase: true,
                    isActive: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total, limit, offset };
    }

    /**
     * Get user detail
     */
    async getUserDetail(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                cohort: true,
                missions: {
                    take: 10,
                    orderBy: { assignedAt: 'desc' },
                    include: { mission: true },
                },
                incomeRecords: {
                    take: 10,
                    orderBy: { earnedAt: 'desc' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User ${userId} not found`);
        }

        return user;
    }


    /**
     * Manually update user level
     */
    async updateUserLevel(userId: string, level: IdentityLevel) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { identityLevel: level },
        });

        // Log upgrade
        if (user.identityLevel !== level) {
            await this.missionEngine.logIdentityUpgrade(
                userId,
                user.identityLevel,
                level,
                'ADMIN_MANUAL_UPDATE'
            );
        }

        return updated;
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

            // Cross-validation Warnings (calculated from income/status inconsistencies)
            warnings: this.assessmentService.generateWarnings(applicant as any),
        };
    }

    /**
     * Get cohort capacity status
     */
    async getCohortCapacity(cohortId?: string) {
        // Get active cohort if not specified
        const cohort = cohortId
            ? await this.prisma.cohort.findUnique({ where: { id: cohortId } })
            : await this.prisma.cohort.findFirst({ where: { isActive: true } });

        if (!cohort) {
            return { capacity: 50, filled: 0, remaining: 50, isAtCapacity: false };
        }

        // Count admitted/converted users in this cohort
        const filled = await this.prisma.applicant.count({
            where: {
                cohortId: cohort.id,
                status: { in: [ApplicantStatus.ADMITTED, ApplicantStatus.CONVERTED] },
            },
        });

        return {
            cohortId: cohort.id,
            cohortName: cohort.name,
            capacity: cohort.capacity,
            filled,
            remaining: Math.max(0, cohort.capacity - filled),
            isAtCapacity: filled >= cohort.capacity,
        };
    }

    /**
     * Make admission decision for an applicant
     */
    async makeAdmissionDecision(
        applicantId: string,
        decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
        options?: {
            notes?: string;
            customMessage?: string;
            isCapacityRejection?: boolean;
        },
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

        // Store custom message and capacity flag in diagnostic report
        const diagnosticUpdate: Record<string, any> = {
            ...(applicant.diagnosticReport as object),
            ...(options?.notes && { adminNotes: options.notes }),
            ...(options?.customMessage && { customMessage: options.customMessage }),
            ...(options?.isCapacityRejection && { isCapacityRejection: true }),
        };

        // Update applicant with decision
        const updated = await this.prisma.applicant.update({
            where: { id: applicantId },
            data: {
                status,
                reviewedAt: new Date(),
                reviewedBy: 'admin', // TODO: Use actual admin ID
                diagnosticReport: diagnosticUpdate,
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

    /**
     * Bulk admission decision for multiple applicants
     */
    async makeBulkDecision(
        applicantIds: string[],
        decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
        options?: {
            notes?: string;
            customMessage?: string;
            isCapacityRejection?: boolean;
        },
    ) {
        const results: Array<{ applicantId: string; success: boolean; error?: string }> = [];

        // Check capacity for bulk admits
        if (decision === 'ADMITTED') {
            const capacity = await this.getCohortCapacity();
            if (capacity.remaining < applicantIds.length) {
                return {
                    success: false,
                    error: `Cannot admit ${applicantIds.length} applicants. Only ${capacity.remaining} spots remaining.`,
                    capacityStatus: capacity,
                };
            }
        }

        // Process each applicant
        for (const applicantId of applicantIds) {
            try {
                await this.makeAdmissionDecision(applicantId, decision, options);
                results.push({ applicantId, success: true });
            } catch (error) {
                results.push({
                    applicantId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        this.logger.log(`Bulk decision: ${successCount} succeeded, ${failCount} failed`);

        return {
            success: failCount === 0,
            total: applicantIds.length,
            successCount,
            failCount,
            results,
        };
    }

    // ============================================================================
    // SUPPORT REQUEST MANAGEMENT (Decision Reason Code Enforcement)
    // ============================================================================

    /**
     * Make a decision on a support request
     * 
     * STRICT ENFORCEMENT:
     * - DENY requires denialReasonCode (throws BadRequestException if missing)
     * - APPROVE sets expiresAt to 72 hours from now
     * - COMPLETE marks the request as fulfilled
     */
    async decideSupportRequest(
        requestId: string,
        decision: 'APPROVE' | 'DENY' | 'COMPLETE',
        options: {
            denialReasonCode?: SupportDenialReason;
            amount?: number;
            notes?: string;
            adminId?: string;
        } = {},
    ) {
        // Find the request
        const request = await this.prisma.supportRequest.findUnique({
            where: { id: requestId },
            include: { user: true },
        });

        if (!request) {
            throw new NotFoundException(`Support request ${requestId} not found`);
        }

        // Validate current status allows this transition
        if (request.status !== SupportRequestStatus.PENDING &&
            request.status !== SupportRequestStatus.APPROVED &&
            request.status !== SupportRequestStatus.APPROVED_PENDING_DISBURSE) {
            throw new BadRequestException(
                `Cannot ${decision} a request with status ${request.status}`
            );
        }

        // STRICT ENFORCEMENT: Denials require a reason code
        if (decision === 'DENY') {
            if (!options.denialReasonCode) {
                throw new BadRequestException(
                    'Denial reason code is required when denying a support request. ' +
                    'Valid codes: INSUFFICIENT_MOMENTUM, NO_ACTIVE_MISSION, PHASE_MISMATCH, ' +
                    'COOLDOWN_ACTIVE, BEHAVIORAL_FLAG, BUDGET_EXHAUSTED, DUPLICATE_REQUEST, MANUAL_ADMIN_DECISION'
                );
            }
        }

        // Calculate expiresAt for approvals (72 hours from now)
        const expiresAt = decision === 'APPROVE'
            ? new Date(Date.now() + 72 * 60 * 60 * 1000)
            : undefined;

        // Map decision to status
        const statusMap: Record<string, SupportRequestStatus> = {
            'APPROVE': SupportRequestStatus.APPROVED_PENDING_DISBURSE,
            'DENY': SupportRequestStatus.DENIED,
            'COMPLETE': SupportRequestStatus.COMPLETED,
        };

        // Update the request
        const updated = await this.prisma.supportRequest.update({
            where: { id: requestId },
            data: {
                status: statusMap[decision],
                denialReasonCode: decision === 'DENY' ? options.denialReasonCode : undefined,
                amount: decision === 'APPROVE' ? options.amount : undefined,
                expiresAt: expiresAt ?? undefined,
                approverId: options.adminId || 'admin',
                reasonCode: options.notes, // Legacy field for free-text notes
            },
        });

        this.logger.log(
            `Support request ${requestId} ${decision}: ` +
            `status=${updated.status}, ` +
            (decision === 'DENY' ? `reason=${options.denialReasonCode}, ` : '') +
            (decision === 'APPROVE' ? `amount=${options.amount}, expires=${expiresAt?.toISOString()}, ` : '') +
            `admin=${options.adminId || 'admin'}`
        );

        return {
            success: true,
            requestId,
            decision,
            status: updated.status,
            expiresAt: updated.expiresAt,
            message: this.getSupportDecisionMessage(decision),
        };
    }

    /**
     * Get pending support requests for admin review
     */
    async getPendingSupportRequests(options: {
        limit?: number;
        offset?: number;
    } = {}) {
        const { limit = 50, offset = 0 } = options;

        return this.prisma.supportRequest.findMany({
            where: {
                status: { in: [SupportRequestStatus.PENDING, SupportRequestStatus.APPROVED_PENDING_DISBURSE] },
            },
            orderBy: { createdAt: 'asc' }, // FIFO
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        identityLevel: true,
                        currentPhase: true,
                    },
                },
            },
        });
    }

    private getSupportDecisionMessage(decision: 'APPROVE' | 'DENY' | 'COMPLETE'): string {
        switch (decision) {
            case 'APPROVE':
                return 'Support request approved. Disbursement is pending.';
            case 'DENY':
                return 'Support request denied with reason code recorded.';
            case 'COMPLETE':
                return 'Support request marked as completed.';
        }
    }
}
