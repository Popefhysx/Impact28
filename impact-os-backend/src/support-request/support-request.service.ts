import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SupportType, SupportRequestStatus, CurrencyType } from '@prisma/client';
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
 */

// Momentum threshold for support eligibility
const MIN_MOMENTUM_FOR_SUPPORT = 50;

@Injectable()
export class SupportRequestService {
    private readonly logger = new Logger(SupportRequestService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Check if a participant is eligible to request support
     */
    async checkEligibility(userId: string): Promise<{
        eligible: boolean;
        reason?: string;
        canRequestTypes: SupportType[];
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
                canRequestTypes: [],
            };
        }

        // Check if any active missions (behavior evidence)
        if (user.missions.length === 0) {
            return {
                eligible: false,
                reason: 'Start a mission to unlock support requests.',
                canRequestTypes: [],
            };
        }

        // Available support types (Cash is hidden by default - needs admin enable)
        const canRequestTypes: SupportType[] = [
            SupportType.DATA,
            SupportType.TRANSPORT,
            SupportType.TOOLS,
            SupportType.COUNSELLING,
        ];

        return {
            eligible: true,
            canRequestTypes,
        };
    }

    /**
     * Create a support request
     */
    async createRequest(userId: string, dto: CreateSupportRequestDto) {
        // Check eligibility first
        const eligibility = await this.checkEligibility(userId);
        if (!eligibility.eligible) {
            throw new BadRequestException(eligibility.reason || 'Not eligible for support');
        }

        // Validate support type is allowed
        if (!eligibility.canRequestTypes.includes(dto.type)) {
            throw new BadRequestException('This support type is not available');
        }

        // Create the request
        const request = await this.prisma.supportRequest.create({
            data: {
                userId,
                type: dto.type,
                missionId: dto.missionId,
                justification: dto.justification,
                evidence: dto.evidence,
                status: SupportRequestStatus.PENDING,
            },
        });

        this.logger.log(`Support request created: ${request.id} (${dto.type}) for user ${userId}`);

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
            case SupportRequestStatus.DENIED:
                return "We can't fulfill this request now. Keep completing missions!";
            case SupportRequestStatus.COMPLETED:
                return 'Support delivered';
            default:
                return 'Status unknown';
        }
    }
}
