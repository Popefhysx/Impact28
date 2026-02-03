import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import {
  IncomeSource,
  ProofType,
  VerificationStatus,
  CurrencyType,
  IdentityLevel,
} from '@prisma/client';

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
  L4_FIRST_DOLLAR: 1, // First verified income
  L4_EARNER_MIN: 50, // Minimum to be considered an earner
  L5_CATALYST: 500, // Threshold for L5 (can mentor others)
};

import { MissionEngineService } from '../mission/mission-engine.service';

@Injectable()
export class IncomeService {
  private readonly logger = new Logger(IncomeService.name);

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
    private missionEngine: MissionEngineService,
  ) {}

  /**
   * Submit income proof for verification
   */
  async submitIncome(userId: string, dto: SubmitIncomeDto) {
    // Convert to USD for normalization
    const amountUSD =
      dto.currency === 'USD' ? dto.amount : dto.amount * NGN_TO_USD_RATE;

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
        earnedAt: new Date(dto.earnedAt),
        status: VerificationStatus.SUBMITTED,
      },
    });

    this.logger.log(
      `Income submitted by ${userId}: ${dto.amount} ${dto.currency || 'NGN'}`,
    );
    return record;
  }

  /**
   * Get user's income records
   */
  async getUserIncome(userId: string, status?: VerificationStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.prisma.incomeRecord.findMany({
      where,
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * Get user's income statistics
   */
  async getUserIncomeStats(userId: string): Promise<IncomeStats> {
    const [verified, pending, rejected] = await Promise.all([
      this.prisma.incomeRecord.aggregate({
        where: { userId, status: VerificationStatus.VERIFIED },
        _sum: { amount: true, amountUSD: true },
        _count: true,
      }),
      this.prisma.incomeRecord.aggregate({
        where: { userId, status: VerificationStatus.SUBMITTED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.incomeRecord.aggregate({
        where: { userId, status: VerificationStatus.REJECTED },
        _count: true,
      }),
    ]);

    return {
      totalVerified: verified._count,
      totalPending: pending._count,
      totalRejected: rejected._count,
      verifiedAmountNGN: Number(verified._sum.amount || 0),
      verifiedAmountUSD: Number(verified._sum.amountUSD || 0),
      recordCount: verified._count + pending._count + rejected._count,
    };
  }

  /**
   * Get pending income reviews for admin
   */
  async getPendingReviews(limit?: number) {
    return this.prisma.incomeRecord.findMany({
      where: { status: VerificationStatus.SUBMITTED },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            identityLevel: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
      take: limit || 20,
    });
  }

  /**
   * Approve income record
   */
  async approveIncome(recordId: string, adminId: string) {
    const record = await this.prisma.incomeRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Income record not found');
    }

    if (record.status !== VerificationStatus.SUBMITTED) {
      throw new Error('Record is not pending verification');
    }

    // Update record
    const updated = await this.prisma.incomeRecord.update({
      where: { id: recordId },
      data: {
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });

    // Credit INCOME_PROOF currency
    const amountUSDValue = record.amountUSD ? Number(record.amountUSD) : 0;
    if (amountUSDValue > 0) {
      await this.currencyService.credit(
        record.userId,
        CurrencyType.INCOME_PROOF,
        Math.round(amountUSDValue * 100), // Convert to cents/points
        `Income verified: ${record.description}`,
        recordId,
      );
    }

    // Check for level upgrade
    await this.checkLevelUpgrade(record.userId);

    this.logger.log(`Income ${recordId} approved by ${adminId}`);
    return updated;
  }

  /**
   * Reject income record
   */
  async rejectIncome(recordId: string, adminId: string, reason: string) {
    const record = await this.prisma.incomeRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Income record not found');
    }

    if (record.status !== VerificationStatus.SUBMITTED) {
      throw new Error('Record is not pending verification');
    }

    const updated = await this.prisma.incomeRecord.update({
      where: { id: recordId },
      data: {
        status: VerificationStatus.REJECTED,
        rejectionReason: reason,
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });

    this.logger.log(`Income ${recordId} rejected by ${adminId}: ${reason}`);
    return updated;
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

      await this.missionEngine.logIdentityUpgrade(
        userId,
        IdentityLevel.L3_EXPOSED,
        IdentityLevel.L4_EARNER,
        'INCOME_THRESHOLD_L4',
      );

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

      await this.missionEngine.logIdentityUpgrade(
        userId,
        IdentityLevel.L4_EARNER,
        IdentityLevel.L5_CATALYST,
        'INCOME_THRESHOLD_L5',
      );

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
    const userIds = topEarners.map((e) => e.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identityLevel: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topEarners.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      user: userMap.get(e.userId),
      totalEarnedUSD: e._sum.amountUSD?.toNumber() || 0,
    }));
  }
}
