import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SupportType, SupportRequestStatus, CurrencyType, ProgramPhase, SupportDenialReason } from '@prisma/client';
import { CreateSupportRequestDto } from './dto';

/**
 * Support Request Service
 * 
 * Participant-facing support request flow.
 * 
 * System Laws:
 * - Support follows action, not need statements
 * - Participants do not see amounts or budgets
 * - All requests must be tied to mission progress
 * - Phase-gated: support types depend on program phase
 * - Cooldown enforced: 24h between same-type requests
 */

// Momentum threshold for support eligibility
const MIN_MOMENTUM_FOR_SUPPORT = 50;

// Cooldown period between requests of same type (24 hours)
const COOLDOWN_HOURS = 24;

// Expiration period for approved requests (72 hours)
const EXPIRATION_HOURS = 72;

// Phase → allowed support types mapping
const PHASE_SUPPORT_MAP: Record<ProgramPhase, SupportType[]> = {
    [ProgramPhase.ONBOARDING]: [SupportType.DATA],
    [ProgramPhase.SKILL_BUILDING]: [SupportType.DATA, SupportType.TOOLS],
    [ProgramPhase.MARKET_EXPOSURE]: [SupportType.DATA, SupportType.TRANSPORT, SupportType.TOOLS],
    [ProgramPhase.INCOME_GENERATION]: [SupportType.DATA, SupportType.TRANSPORT, SupportType.TOOLS, SupportType.COUNSELLING],
    [ProgramPhase.CATALYST]: [], // Graduates don't need support
};

@Injectable()
export class SupportRequestService {
    private readonly logger = new Logger(SupportRequestService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Check if a participant is eligible to request support
     * Enforces: momentum threshold, active mission, phase-gating, and cooldown
     */
    async checkEligibility(userId: string): Promise<{
        eligible: boolean;
        reason?: string;
        denialReasonCode?: SupportDenialReason;
        canRequestTypes: SupportType[];
        currentPhase?: ProgramPhase;
    }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                missions: {
                    where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'] } },
                },
                currencyLedger: {
                    where: { currencyType: CurrencyType.MOMENTUM },
                },
                supportWallet: true,
                supportRequests: {
                    where: {
                        status: { in: [SupportRequestStatus.PENDING, SupportRequestStatus.APPROVED, SupportRequestStatus.APPROVED_PENDING_DISBURSE] },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user is active
        if (!user.isActive) {
            return {
                eligible: false,
                reason: 'Account is paused. Complete a reactivation task to restore access.',
                denialReasonCode: SupportDenialReason.BEHAVIORAL_FLAG,
                canRequestTypes: [],
            };
        }

        // Check momentum threshold
        const totalMomentum = user.currencyLedger
            .reduce((sum, entry) => sum + entry.amount, 0);

        if (totalMomentum < MIN_MOMENTUM_FOR_SUPPORT) {
            return {
                eligible: false,
                reason: 'Keep completing missions to unlock support requests.',
                denialReasonCode: SupportDenialReason.INSUFFICIENT_MOMENTUM,
                canRequestTypes: [],
            };
        }

        // Check if any active missions (behavior evidence)
        if (user.missions.length === 0) {
            return {
                eligible: false,
                reason: 'Start a mission to unlock support requests.',
                denialReasonCode: SupportDenialReason.NO_ACTIVE_MISSION,
                canRequestTypes: [],
            };
        }

        // Check cooldown (24h since last request)
        if (user.supportCooldownUntil && new Date() < user.supportCooldownUntil) {
            return {
                eligible: false,
                reason: 'Please wait before submitting another request.',
                denialReasonCode: SupportDenialReason.COOLDOWN_ACTIVE,
                canRequestTypes: [],
            };
        }

        // Check for duplicate pending requests
        const hasPendingRequest = user.supportRequests.some(
            r => r.status === SupportRequestStatus.PENDING
        );
        if (hasPendingRequest) {
            return {
                eligible: false,
                reason: 'You have a pending request. Please wait for it to be reviewed.',
                denialReasonCode: SupportDenialReason.DUPLICATE_REQUEST,
                canRequestTypes: [],
            };
        }

        // Phase-gated support types
        const currentPhase = user.currentPhase;
        const phaseAllowedTypes = PHASE_SUPPORT_MAP[currentPhase] || [];

        // If in CATALYST phase (graduated), no support available
        if (phaseAllowedTypes.length === 0) {
            return {
                eligible: false,
                reason: 'Support is not available in your current program phase.',
                denialReasonCode: SupportDenialReason.PHASE_MISMATCH,
                canRequestTypes: [],
                currentPhase,
            };
        }

        return {
            eligible: true,
            canRequestTypes: phaseAllowedTypes,
            currentPhase,
        };
    }

    /**
     * Create a support request
     * Sets cooldown after submission to prevent spam
     */
    async createRequest(userId: string, dto: CreateSupportRequestDto) {
        // Check eligibility first
        const eligibility = await this.checkEligibility(userId);
        if (!eligibility.eligible) {
            throw new BadRequestException(eligibility.reason || 'Not eligible for support');
        }

        // Validate support type is allowed for current phase
        if (!eligibility.canRequestTypes.includes(dto.type)) {
            throw new BadRequestException(
                `${dto.type} support is not available in the ${eligibility.currentPhase} phase.`
            );
        }

        // Create the request using a transaction to also set the cooldown
        const cooldownUntil = new Date();
        cooldownUntil.setHours(cooldownUntil.getHours() + COOLDOWN_HOURS);

        const [request] = await this.prisma.$transaction([
            this.prisma.supportRequest.create({
                data: {
                    userId,
                    type: dto.type,
                    missionId: dto.missionId,
                    justification: dto.justification,
                    evidence: dto.evidence,
                    status: SupportRequestStatus.PENDING,
                },
            }),
            // Set cooldown on user
            this.prisma.user.update({
                where: { id: userId },
                data: { supportCooldownUntil: cooldownUntil },
            }),
        ]);

        this.logger.log(`Support request created: ${request.id} (${dto.type}) for user ${userId}. Cooldown until ${cooldownUntil.toISOString()}`);

        // Return sanitized response (no amounts)
        return {
            id: request.id,
            type: request.type,
            status: request.status,
            statusMessage: this.getStatusMessage(request.status),
            createdAt: request.createdAt,
        };
    }

    /**
     * Get participant's support request history
     * Note: Amounts are never shown to participants
     */
    async getRequestHistory(userId: string) {
        const requests = await this.prisma.supportRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                status: true,
                missionId: true,
                createdAt: true,
                updatedAt: true,
                // NOTE: amount is NOT selected - never show to participant
            },
        });

        return requests.map(r => ({
            ...r,
            statusMessage: this.getStatusMessage(r.status),
        }));
    }

    /**
     * Get a single request status
     */
    async getRequestStatus(userId: string, requestId: string) {
        const request = await this.prisma.supportRequest.findFirst({
            where: {
                id: requestId,
                userId, // Ensure ownership
            },
            select: {
                id: true,
                type: true,
                status: true,
                missionId: true,
                justification: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        return {
            ...request,
            statusMessage: this.getStatusMessage(request.status),
        };
    }

    /**
     * Get active (incomplete) missions for the request form dropdown
     */
    async getActiveMissions(userId: string) {
        const missions = await this.prisma.missionAssignment.findMany({
            where: {
                userId,
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            },
            include: {
                mission: {
                    select: {
                        id: true,
                        title: true,
                        skillDomain: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });

        return missions.map(m => ({
            id: m.missionId,
            title: m.mission.title,
            domain: m.mission.skillDomain,
        }));
    }

    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================

    private getStatusMessage(status: SupportRequestStatus): string {
        switch (status) {
            case SupportRequestStatus.PENDING:
                return 'Your request is being reviewed';
            case SupportRequestStatus.APPROVED:
                return 'Support is on the way';
            case SupportRequestStatus.APPROVED_PENDING_DISBURSE:
                return 'Approved - disbursement in progress';
            case SupportRequestStatus.DENIED:
                return "We can't fulfill this request now. Keep completing missions!";
            case SupportRequestStatus.COMPLETED:
                return 'Support delivered';
            case SupportRequestStatus.EXPIRED:
                return 'Request expired - please submit a new request';
            default:
                return 'Status unknown';
        }
    }
}
