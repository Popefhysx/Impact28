import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ParticipantState, GateResult } from '@prisma/client';
import { StateAuthorityService } from './state-authority.service';

/**
 * Graduation Authority Service
 *
 * Owns graduation and exit decisions. These are IRREVERSIBLE states.
 *
 * Graduation Conditions:
 * - Day 90 reached
 * - Income Proof verified
 * - All mandatory journals submitted
 * - No unresolved gate failures
 *
 * Exit Conditions:
 * - Failure to earn income by Day 90
 * - Disqualification due to non-compliance
 * - Voluntary withdrawal
 */
@Injectable()
export class GraduationAuthorityService {
    private readonly logger = new Logger(GraduationAuthorityService.name);

    constructor(
        private prisma: PrismaService,
        private stateAuthority: StateAuthorityService,
    ) { }

    /**
     * Check if participant is eligible for graduation
     */
    async checkGraduationEligibility(
        userId: string,
    ): Promise<GraduationEligibility> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { cohort: true },
        });

        if (!user || !user.cohort) {
            return { eligible: false, reasons: ['User or cohort not found'] };
        }

        const reasons: string[] = [];

        // Check Day 90 reached
        const now = new Date();
        const daysSinceStart = Math.floor(
            (now.getTime() - user.cohort.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceStart < 90) {
            reasons.push(`Day 90 not reached (current: Day ${daysSinceStart})`);
        }

        // Check verified income
        const verifiedIncome = await this.prisma.incomeRecord.findFirst({
            where: { userId, status: 'VERIFIED' },
        });
        if (!verifiedIncome) {
            reasons.push('No verified income proof');
        }

        // Check gate failures
        const failedGates = await this.prisma.gateEvaluation.findMany({
            where: { userId, result: { in: [GateResult.FAIL, GateResult.INTERVENTION_REQUIRED] } },
        });
        if (failedGates.length > 0) {
            reasons.push(`Unresolved gate failures: ${failedGates.length}`);
        }

        // Check participant state
        if (user.participantState === ParticipantState.PAUSED) {
            reasons.push('Participant is paused');
        }
        if (user.participantState === ParticipantState.EXITED) {
            reasons.push('Participant has already exited');
        }
        if (user.participantState === ParticipantState.GRADUATED) {
            reasons.push('Participant has already graduated');
        }

        return {
            eligible: reasons.length === 0,
            reasons,
            daysSinceStart,
            hasVerifiedIncome: !!verifiedIncome,
            unresolvedGates: failedGates.length,
        };
    }

    /**
     * Graduate a participant (normally called by gate enforcement)
     */
    async graduateParticipant(
        userId: string,
        graduatedBy: string = 'SYSTEM',
    ): Promise<{ success: boolean; error?: string }> {
        const eligibility = await this.checkGraduationEligibility(userId);

        if (!eligibility.eligible) {
            return {
                success: false,
                error: `Not eligible: ${eligibility.reasons.join(', ')}`,
            };
        }

        const result = await this.stateAuthority.transitionState(
            userId,
            ParticipantState.GRADUATED,
            'Completed all graduation requirements',
            graduatedBy,
        );

        if (result.success) {
            this.logger.log(`Participant ${userId} graduated`);

            // Log in command audit
            await this.prisma.commandAuditLog.create({
                data: {
                    action: 'GRADUATE_PARTICIPANT',
                    targetId: userId,
                    targetType: 'USER',
                    reason: 'Completed all graduation requirements',
                    performedBy: graduatedBy,
                    newValue: { state: ParticipantState.GRADUATED },
                },
            });
        }

        return result;
    }

    /**
     * Exit a participant (normally called by gate enforcement or admin)
     */
    async exitParticipant(
        userId: string,
        reason: string,
        exitedBy: string = 'SYSTEM',
    ): Promise<{ success: boolean; error?: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.participantState === ParticipantState.GRADUATED) {
            return { success: false, error: 'Cannot exit a graduated participant' };
        }

        if (user.participantState === ParticipantState.EXITED) {
            return { success: false, error: 'Participant already exited' };
        }

        const result = await this.stateAuthority.transitionState(
            userId,
            ParticipantState.EXITED,
            reason,
            exitedBy,
        );

        if (result.success) {
            this.logger.log(`Participant ${userId} exited: ${reason}`);

            await this.prisma.commandAuditLog.create({
                data: {
                    action: 'EXIT_PARTICIPANT',
                    targetId: userId,
                    targetType: 'USER',
                    reason,
                    performedBy: exitedBy,
                    previousValue: { state: user.participantState },
                    newValue: { state: ParticipantState.EXITED },
                },
            });
        }

        return result;
    }

    /**
     * Handle voluntary withdrawal
     */
    async processVoluntaryWithdrawal(
        userId: string,
        withdrawalReason: string,
    ): Promise<{ success: boolean; error?: string }> {
        return this.exitParticipant(
            userId,
            `Voluntary withdrawal: ${withdrawalReason}`,
            'SELF',
        );
    }

    /**
     * Get graduation statistics for a cohort
     */
    async getCohortGraduationStats(cohortId: string): Promise<GraduationStats> {
        const users = await this.prisma.user.findMany({
            where: { cohortId },
            select: { participantState: true },
        });

        return {
            total: users.length,
            active: users.filter((u) => u.participantState === ParticipantState.ACTIVE).length,
            atRisk: users.filter((u) => u.participantState === ParticipantState.AT_RISK).length,
            paused: users.filter((u) => u.participantState === ParticipantState.PAUSED).length,
            graduated: users.filter((u) => u.participantState === ParticipantState.GRADUATED).length,
            exited: users.filter((u) => u.participantState === ParticipantState.EXITED).length,
        };
    }

    /**
     * Get pending graduation decisions
     */
    async getPendingGraduationDecisions(cohortId?: string) {
        // Find users at Day 90+ who haven't graduated or exited
        const cohorts = await this.prisma.cohort.findMany({
            where: {
                isActive: true,
                ...(cohortId ? { id: cohortId } : {}),
            },
            include: {
                users: {
                    where: {
                        participantState: {
                            in: [ParticipantState.ACTIVE, ParticipantState.AT_RISK],
                        },
                    },
                },
            },
        });

        const pending: any[] = [];

        for (const cohort of cohorts) {
            const daysSinceStart = Math.floor(
                (new Date().getTime() - cohort.startDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysSinceStart >= 90) {
                for (const user of cohort.users) {
                    const eligibility = await this.checkGraduationEligibility(user.id);
                    pending.push({
                        userId: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        cohortId: cohort.id,
                        cohortName: cohort.name,
                        daysSinceStart,
                        eligibility,
                    });
                }
            }
        }

        return pending;
    }
}

// Types
export interface GraduationEligibility {
    eligible: boolean;
    reasons: string[];
    daysSinceStart?: number;
    hasVerifiedIncome?: boolean;
    unresolvedGates?: number;
}

export interface GraduationStats {
    total: number;
    active: number;
    atRisk: number;
    paused: number;
    graduated: number;
    exited: number;
}
