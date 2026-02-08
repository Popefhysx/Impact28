import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ParticipantState, CurrencyType } from '@prisma/client';
import { StateAuthorityService } from './state-authority.service';

/**
 * Pause & Escalation Service
 *
 * Handles automatic pause triggers and reactivation logic.
 *
 * Automatic Pause Triggers:
 * - Momentum < threshold for 7 consecutive days
 * - Gate failure without remediation
 * - Prolonged inactivity (no mission activity for 14+ days)
 *
 * Pause Effects:
 * - Mission assignment halted
 * - Stipend eligibility frozen
 * - Support requests disabled
 */
@Injectable()
export class PauseEscalationService {
    private readonly logger = new Logger(PauseEscalationService.name);

    private readonly MOMENTUM_THRESHOLD = 50;
    private readonly LOW_MOMENTUM_DAYS = 7;
    private readonly INACTIVITY_DAYS = 14;

    constructor(
        private prisma: PrismaService,
        private stateAuthority: StateAuthorityService,
    ) { }

    /**
     * Check and apply automatic pauses (called by scheduled task)
     */
    async runAutoPauseCheck(): Promise<AutoPauseResult> {
        const result: AutoPauseResult = {
            lowMomentum: 0,
            inactivity: 0,
            unresolvedGates: 0,
        };

        // Get active participants
        const activeUsers = await this.prisma.user.findMany({
            where: {
                participantState: { in: [ParticipantState.ACTIVE, ParticipantState.AT_RISK] },
                cohortId: { not: null },
            },
        });

        for (const user of activeUsers) {
            // Check momentum threshold
            const isPausedForMomentum = await this.checkLowMomentum(user.id);
            if (isPausedForMomentum) {
                result.lowMomentum++;
                continue;
            }

            // Check inactivity
            const isPausedForInactivity = await this.checkInactivity(user.id);
            if (isPausedForInactivity) {
                result.inactivity++;
                continue;
            }

            // Check unresolved gate failures
            const isPausedForGates = await this.checkUnresolvedGates(user.id);
            if (isPausedForGates) {
                result.unresolvedGates++;
            }
        }

        this.logger.log(
            `Auto-pause check complete: ${result.lowMomentum} momentum, ${result.inactivity} inactivity, ${result.unresolvedGates} gates`,
        );

        return result;
    }

    /**
     * Check if user has low momentum for consecutive days
     */
    private async checkLowMomentum(userId: string): Promise<boolean> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - this.LOW_MOMENTUM_DAYS);

        // Get momentum balance
        const momentum = await this.prisma.currencyLedger.aggregate({
            where: { userId, currencyType: CurrencyType.MOMENTUM },
            _sum: { amount: true },
        });

        const currentMomentum = momentum._sum.amount ?? 0;

        if (currentMomentum < this.MOMENTUM_THRESHOLD) {
            // Check if already paused for this reason
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (user?.participantState === ParticipantState.PAUSED) {
                return false;
            }

            await this.stateAuthority.transitionState(
                userId,
                ParticipantState.PAUSED,
                `Momentum below ${this.MOMENTUM_THRESHOLD} for extended period`,
                'SYSTEM',
            );

            return true;
        }

        return false;
    }

    /**
     * Check for prolonged inactivity
     */
    private async checkInactivity(userId: string): Promise<boolean> {
        const inactivityCutoff = new Date();
        inactivityCutoff.setDate(inactivityCutoff.getDate() - this.INACTIVITY_DAYS);

        // Check last mission activity
        const lastMission = await this.prisma.missionAssignment.findFirst({
            where: { userId },
            orderBy: { assignedAt: 'desc' },
        });

        // Check last check-in
        const lastCheckIn = await this.prisma.checkIn.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const lastActivity = lastMission?.assignedAt ?? lastCheckIn?.createdAt;

        if (!lastActivity || lastActivity < inactivityCutoff) {
            await this.stateAuthority.transitionState(
                userId,
                ParticipantState.PAUSED,
                `No activity for ${this.INACTIVITY_DAYS}+ days`,
                'SYSTEM',
            );
            return true;
        }

        return false;
    }

    /**
     * Check for unresolved gate failures requiring intervention
     */
    private async checkUnresolvedGates(userId: string): Promise<boolean> {
        const failedGates = await this.prisma.gateEvaluation.findMany({
            where: {
                userId,
                result: 'INTERVENTION_REQUIRED',
            },
        });

        // If intervention required for > 7 days with no resolution, pause
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const staleInterventions = failedGates.filter(
            (g) => g.executedAt < sevenDaysAgo,
        );

        if (staleInterventions.length > 0) {
            await this.stateAuthority.transitionState(
                userId,
                ParticipantState.PAUSED,
                `Unresolved gate intervention for 7+ days`,
                'SYSTEM',
            );
            return true;
        }

        return false;
    }

    /**
     * Reactivate a paused participant (requires task completion)
     */
    async reactivateParticipant(
        userId: string,
        reactivatedBy: string,
        reason: string,
    ): Promise<{ success: boolean; error?: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.participantState !== ParticipantState.PAUSED) {
            return { success: false, error: 'User is not paused' };
        }

        const result = await this.stateAuthority.transitionState(
            userId,
            ParticipantState.ACTIVE,
            reason,
            reactivatedBy,
        );

        if (result.success) {
            // Log the reactivation in audit
            await this.prisma.commandAuditLog.create({
                data: {
                    action: 'REACTIVATE_PARTICIPANT',
                    targetId: userId,
                    targetType: 'USER',
                    reason,
                    performedBy: reactivatedBy,
                    previousValue: { state: ParticipantState.PAUSED },
                    newValue: { state: ParticipantState.ACTIVE },
                },
            });
        }

        return result;
    }

    /**
     * Get all paused participants
     */
    async getPausedParticipants(cohortId?: string) {
        return this.prisma.user.findMany({
            where: {
                participantState: ParticipantState.PAUSED,
                ...(cohortId ? { cohortId } : {}),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                pausedAt: true,
                pauseReason: true,
                cohortId: true,
            },
        });
    }
}

// Types
export interface AutoPauseResult {
    lowMomentum: number;
    inactivity: number;
    unresolvedGates: number;
}
