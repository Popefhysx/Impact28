import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import { IncomeSource, ProofType, VerificationStatus, CurrencyType, IdentityLevel } from '@prisma/client';

/**
 * Income Verification Service
 * 
 * Handles the L4_EARNER income verification pipeline:
 * 1. User submits income proof
 * 2. Admin reviews and verifies
 * 3. Verified income credits INCOME_PROOF currency
 * 4. Accumulating income can trigger level upgrades
 */

interface SubmitIncomeDto {
    amount: number;
    currency?: string;
    source: IncomeSource;
    platform?: string;
    clientName?: string;
    description: string;
    proofUrl: string;
    proofType: ProofType;
    earnedAt: Date;
}

export interface IncomeStats {
    totalVerified: number;
    totalPending: number;
    totalRejected: number;
    verifiedAmountNGN: number;
    verifiedAmountUSD: number;
    recordCount: number;
}

// USD conversion rate (simplified - in production use an API)
const NGN_TO_USD_RATE = 0.00065; // ~1/1537

// Thresholds for level progression (in USD equivalent)
const INCOME_THRESHOLDS = {
    L4_FIRST_DOLLAR: 1,       // First verified income
    L4_EARNER_MIN: 50,        // Minimum to be considered an earner
    L5_CATALYST: 500,         // Threshold for L5 (can mentor others)
};

@Injectable()
export class IncomeService {
    private readonly logger = new Logger(IncomeService.name);

    constructor(
        private prisma: PrismaService,
        private currencyService: CurrencyService,
    ) { }

    /**
     * Submit income for verification
     */
    async submitIncome(userId: string, dto: SubmitIncomeDto): Promise<{ id: string }> {
        // Convert to USD if NGN
        const amountUSD = dto.currency === 'USD'
            ? dto.amount
            : dto.amount * NGN_TO_USD_RATE;

        const record = await this.prisma.incomeRecord.create({
            data: {
                userId,
                amount: dto.amount,
                currency: dto.currency || 'NGN',
                amountUSD,
                source: dto.source,
                platform: dto.platform,
                clientName: dto.clientName,
                description: dto.description,
                proofUrl: dto.proofUrl,
                proofType: dto.proofType,
                earnedAt: dto.earnedAt,
                status: VerificationStatus.SUBMITTED,
            },
        });

        this.logger.log(`Income submitted by ${userId}: ${dto.amount} ${dto.currency || 'NGN'}`);

        return { id: record.id };
    }

    /**
     * Get user's income records
     */
    async getUserIncome(userId: string, status?: VerificationStatus) {
        return this.prisma.incomeRecord.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            orderBy: { earnedAt: 'desc' },
            select: {
                id: true,
                amount: true,
                currency: true,
                amountUSD: true,
                source: true,
                platform: true,
                clientName: true,
                description: true,
                proofUrl: true,
                proofType: true,
                status: true,
                earnedAt: true,
                submittedAt: true,
                verifiedAt: true,
                rejectionReason: true,
            },
        });
    }

    /**
     * Admin: Get pending income records for review
     */
    async getPendingReviews(limit: number = 50) {
        return this.prisma.incomeRecord.findMany({
            where: { status: VerificationStatus.SUBMITTED },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        identityLevel: true,
                    },
                },
            },
            orderBy: { submittedAt: 'asc' },
            take: limit,
        });
    }

    /**
     * Admin: Approve income record
     */
    async approveIncome(
        recordId: string,
        adminId: string,
    ): Promise<{ success: boolean; newTotal: number }> {
        const record = await this.prisma.incomeRecord.findUnique({
            where: { id: recordId },
            include: { user: true },
        });

        if (!record) {
            throw new NotFoundException('Income record not found');
        }

        if (record.status !== VerificationStatus.SUBMITTED) {
            return { success: false, newTotal: 0 };
        }

        // Update record status
        await this.prisma.incomeRecord.update({
            where: { id: recordId },
            data: {
                status: VerificationStatus.VERIFIED,
                verifiedBy: adminId,
                verifiedAt: new Date(),
            },
        });

        // Credit INCOME_PROOF currency
        const amountUSD = record.amountUSD?.toNumber() || (record.amount.toNumber() * NGN_TO_USD_RATE);
        const creditAmount = Math.floor(amountUSD * 100); // 1 USD = 100 INCOME_PROOF points

        await this.currencyService.recordIncomeProof(
            record.userId,
            creditAmount,
            recordId,
        );

        // Check for level upgrade
        await this.checkLevelUpgrade(record.userId);

        // Get new total
        const stats = await this.getUserIncomeStats(record.userId);

        this.logger.log(`Income ${recordId} verified by ${adminId}: $${amountUSD.toFixed(2)}`);

        return { success: true, newTotal: stats.verifiedAmountUSD };
    }

    /**
     * Admin: Reject income record
     */
    async rejectIncome(
        recordId: string,
        adminId: string,
        reason: string,
    ): Promise<boolean> {
        const record = await this.prisma.incomeRecord.findUnique({
            where: { id: recordId },
        });

        if (!record || record.status !== VerificationStatus.SUBMITTED) {
            return false;
        }

        await this.prisma.incomeRecord.update({
            where: { id: recordId },
            data: {
                status: VerificationStatus.REJECTED,
                verifiedBy: adminId,
                verifiedAt: new Date(),
                rejectionReason: reason,
            },
        });

        this.logger.log(`Income ${recordId} rejected by ${adminId}: ${reason}`);

        return true;
    }

    /**
     * Get user's income statistics
     */
    async getUserIncomeStats(userId: string): Promise<IncomeStats> {
        const records = await this.prisma.incomeRecord.groupBy({
            by: ['status'],
            where: { userId },
            _sum: {
                amount: true,
                amountUSD: true,
            },
            _count: true,
        });

        const stats: IncomeStats = {
            totalVerified: 0,
            totalPending: 0,
            totalRejected: 0,
            verifiedAmountNGN: 0,
            verifiedAmountUSD: 0,
            recordCount: 0,
        };

        for (const group of records) {
            stats.recordCount += group._count;

            switch (group.status) {
                case VerificationStatus.VERIFIED:
                    stats.totalVerified = group._count;
                    stats.verifiedAmountNGN = group._sum.amount?.toNumber() || 0;
                    stats.verifiedAmountUSD = group._sum.amountUSD?.toNumber() || 0;
                    break;
                case VerificationStatus.SUBMITTED:
                    stats.totalPending = group._count;
                    break;
                case VerificationStatus.REJECTED:
                    stats.totalRejected = group._count;
                    break;
            }
        }

        return stats;
    }

    /**
     * Check if user qualifies for level upgrade based on income
     */
    private async checkLevelUpgrade(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { identityLevel: true },
        });

        if (!user) return;

        const stats = await this.getUserIncomeStats(userId);

        // L3 -> L4: First verified income
        if (
            user.identityLevel === IdentityLevel.L3_EXPOSED &&
            stats.verifiedAmountUSD >= INCOME_THRESHOLDS.L4_FIRST_DOLLAR
        ) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { identityLevel: IdentityLevel.L4_EARNER },
            });
            this.logger.log(`User ${userId} upgraded to L4_EARNER`);
        }

        // L4 -> L5: Sustained income
        if (
            user.identityLevel === IdentityLevel.L4_EARNER &&
            stats.verifiedAmountUSD >= INCOME_THRESHOLDS.L5_CATALYST
        ) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { identityLevel: IdentityLevel.L5_CATALYST },
            });
            this.logger.log(`User ${userId} upgraded to L5_CATALYST`);
        }
    }

    /**
     * Get leaderboard of top earners
     */
    async getIncomeLeaderboard(limit: number = 10) {
        const topEarners = await this.prisma.incomeRecord.groupBy({
            by: ['userId'],
            where: { status: VerificationStatus.VERIFIED },
            _sum: { amountUSD: true },
            orderBy: { _sum: { amountUSD: 'desc' } },
            take: limit,
        });

        // Get user details
        const userIds = topEarners.map(e => e.userId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                identityLevel: true,
            },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        return topEarners.map((e, index) => ({
            rank: index + 1,
            userId: e.userId,
            user: userMap.get(e.userId),
            totalEarnedUSD: e._sum.amountUSD?.toNumber() || 0,
        }));
    }
}
