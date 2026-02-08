import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ParticipantState } from '@prisma/client';

/**
 * State Authority Service
 *
 * The single authority for participant state transitions.
 * Other engines may REQUEST state changes, only Command Centre executes them.
 *
 * State Machine:
 * ACTIVE → AT_RISK → PAUSED → EXITED
 *       ↘         ↗        ↘
 *         GRADUATED
 */
@Injectable()
export class StateAuthorityService {
    private readonly logger = new Logger(StateAuthorityService.name);

    // Valid state transitions
    private readonly validTransitions: Record<ParticipantState, ParticipantState[]> = {
        ACTIVE: [ParticipantState.AT_RISK, ParticipantState.PAUSED, ParticipantState.GRADUATED, ParticipantState.EXITED],
        AT_RISK: [ParticipantState.ACTIVE, ParticipantState.PAUSED, ParticipantState.GRADUATED, ParticipantState.EXITED],
        PAUSED: [ParticipantState.ACTIVE, ParticipantState.AT_RISK, ParticipantState.EXITED],
        EXITED: [], // Terminal state
        GRADUATED: [], // Terminal state
    };

    constructor(private prisma: PrismaService) { }

    /**
     * Execute a state transition (only Command Centre should call this)
     */
    async transitionState(
        userId: string,
        toState: ParticipantState,
        reason: string,
        triggeredBy: string,
        gateEvaluationId?: string,
    ): Promise<StateTransitionResult> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const fromState = user.participantState;

        // Validate transition
        if (!this.isValidTransition(fromState, toState)) {
            this.logger.warn(
                `Invalid state transition: ${fromState} → ${toState} for user ${userId}`,
            );
            return {
                success: false,
                error: `Invalid transition from ${fromState} to ${toState}`,
            };
        }

        // Execute transition in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Update user state
            const updateData: any = { participantState: toState };

            if (toState === ParticipantState.GRADUATED) {
                updateData.graduatedAt = new Date();
            } else if (toState === ParticipantState.EXITED) {
                updateData.exitedAt = new Date();
            } else if (toState === ParticipantState.PAUSED) {
                updateData.pausedAt = new Date();
                updateData.pauseReason = reason;
            } else if (fromState === ParticipantState.PAUSED && toState === ParticipantState.ACTIVE) {
                updateData.pausedAt = null;
                updateData.pauseReason = null;
            }

            await tx.user.update({
                where: { id: userId },
                data: updateData,
            });

            // Create immutable audit log
            await tx.participantStateLog.create({
                data: {
                    userId,
                    fromState,
                    toState,
                    reason,
                    triggeredBy,
                    gateEvaluationId,
                },
            });

            return { fromState, toState };
        });

        this.logger.log(
            `State transition: ${userId} ${result.fromState} → ${result.toState} (${reason})`,
        );

        return {
            success: true,
            fromState: result.fromState,
            toState: result.toState,
        };
    }

    /**
     * Request a state change (for other engines to call)
     */
    async requestStateChange(
        userId: string,
        toState: ParticipantState,
        reason: string,
        requestedBy: string,
    ): Promise<StateTransitionResult> {
        // Log the request
        this.logger.log(
            `State change requested: ${userId} → ${toState} by ${requestedBy}`,
        );

        // Execute the transition
        return this.transitionState(userId, toState, reason, requestedBy);
    }

    /**
     * Get participant's current state
     */
    async getParticipantState(userId: string): Promise<ParticipantState | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { participantState: true },
        });

        return user?.participantState ?? null;
    }

    /**
     * Get state history for a participant
     */
    async getStateHistory(userId: string) {
        return this.prisma.participantStateLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get all participants in a specific state
     */
    async getParticipantsByState(
        state: ParticipantState,
        cohortId?: string,
    ): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
        return this.prisma.user.findMany({
            where: {
                participantState: state,
                ...(cohortId ? { cohortId } : {}),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });
    }

    /**
     * Check if a transition is valid
     */
    isValidTransition(from: ParticipantState, to: ParticipantState): boolean {
        return this.validTransitions[from]?.includes(to) ?? false;
    }

    /**
     * Batch update participants to AT_RISK (for scheduled tasks)
     */
    async markAsAtRisk(
        userIds: string[],
        reason: string,
    ): Promise<{ updated: number }> {
        let updated = 0;

        for (const userId of userIds) {
            const result = await this.transitionState(
                userId,
                ParticipantState.AT_RISK,
                reason,
                'SYSTEM',
            );
            if (result.success) updated++;
        }

        return { updated };
    }
}

// Types
export interface StateTransitionResult {
    success: boolean;
    fromState?: ParticipantState;
    toState?: ParticipantState;
    error?: string;
}
