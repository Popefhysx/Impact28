import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyType } from '@prisma/client';

/**
 * Currency Service
 *
 * Manages the Impact OS currency system:
 * - MOMENTUM: Daily action rewards, decays over inactivity
 * - SKILL_XP: Permanent skill progression
 * - ARENA_POINTS: Commercial exposure and rejection handling
 * - INCOME_PROOF: Verified external income
 *
 * Currency is earned through missions and can unlock power-ups.
 */

export interface CurrencyBalance {
  momentum: number;
  skillXp: number;
  arenaPoints: number;
  incomeProof: number;
}

export interface TransactionResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's current balance for all currencies
   */
  async getBalance(userId: string): Promise<CurrencyBalance> {
    const ledgers = await this.prisma.currencyLedger.groupBy({
      by: ['currencyType'],
      where: { userId },
      _sum: { amount: true },
    });

    const balance: CurrencyBalance = {
      momentum: 0,
      skillXp: 0,
      arenaPoints: 0,
      incomeProof: 0,
    };

    for (const entry of ledgers) {
      switch (entry.currencyType) {
        case CurrencyType.MOMENTUM:
          balance.momentum = entry._sum.amount || 0;
          break;
        case CurrencyType.SKILL_XP:
          balance.skillXp = entry._sum.amount || 0;
          break;
        case CurrencyType.ARENA_POINTS:
          balance.arenaPoints = entry._sum.amount || 0;
          break;
        case CurrencyType.INCOME_PROOF:
          balance.incomeProof = entry._sum.amount || 0;
          break;
      }
    }

    return balance;
  }

  /**
   * Credit currency to a user
   */
  async credit(
    userId: string,
    currencyType: CurrencyType,
    amount: number,
    reason: string,
    missionId?: string,
  ): Promise<TransactionResult> {
    if (amount <= 0) {
      return { success: false, newBalance: 0, transactionId: '' };
    }

    const ledger = await this.prisma.currencyLedger.create({
      data: {
        userId,
        currencyType,
        amount,
        reason,
        missionId,
      },
    });

    const balance = await this.getBalanceForType(userId, currencyType);

    this.logger.log(
      `Credited ${amount} ${currencyType} to user ${userId}: ${reason}`,
    );

    return {
      success: true,
      newBalance: balance,
      transactionId: ledger.id,
    };
  }

  /**
   * Debit currency from a user (for power-ups, penalties, etc.)
   */
  async debit(
    userId: string,
    currencyType: CurrencyType,
    amount: number,
    reason: string,
  ): Promise<TransactionResult> {
    if (amount <= 0) {
      return { success: false, newBalance: 0, transactionId: '' };
    }

    const currentBalance = await this.getBalanceForType(userId, currencyType);

    if (currentBalance < amount) {
      this.logger.warn(
        `Insufficient ${currencyType} balance for user ${userId}`,
      );
      return { success: false, newBalance: currentBalance, transactionId: '' };
    }

    const ledger = await this.prisma.currencyLedger.create({
      data: {
        userId,
        currencyType,
        amount: -amount, // Negative for debit
        reason,
      },
    });

    const newBalance = currentBalance - amount;

    this.logger.log(
      `Debited ${amount} ${currencyType} from user ${userId}: ${reason}`,
    );

    return {
      success: true,
      newBalance,
      transactionId: ledger.id,
    };
  }

  /**
   * Get balance for a specific currency type
   */
  private async getBalanceForType(
    userId: string,
    currencyType: CurrencyType,
  ): Promise<number> {
    const result = await this.prisma.currencyLedger.aggregate({
      where: { userId, currencyType },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  /**
   * Apply momentum decay for inactive users
   * Called by a scheduled job (e.g., daily cron)
   */
  async applyMomentumDecay(
    userId: string,
    decayRate: number = 0.1,
  ): Promise<void> {
    const currentMomentum = await this.getBalanceForType(
      userId,
      CurrencyType.MOMENTUM,
    );

    if (currentMomentum <= 0) return;

    const decayAmount = Math.ceil(currentMomentum * decayRate);

    await this.debit(
      userId,
      CurrencyType.MOMENTUM,
      decayAmount,
      'Momentum decay (inactivity)',
    );

    this.logger.log(
      `Applied momentum decay of ${decayAmount} to user ${userId}`,
    );
  }

  /**
   * Reward mission completion
   */
  async rewardMission(
    userId: string,
    missionId: string,
    rewards: { momentum?: number; skillXp?: number; arenaPoints?: number },
  ): Promise<void> {
    const reason = `Mission completed: ${missionId}`;

    if (rewards.momentum && rewards.momentum > 0) {
      await this.credit(
        userId,
        CurrencyType.MOMENTUM,
        rewards.momentum,
        reason,
        missionId,
      );
    }

    if (rewards.skillXp && rewards.skillXp > 0) {
      await this.credit(
        userId,
        CurrencyType.SKILL_XP,
        rewards.skillXp,
        reason,
        missionId,
      );
    }

    if (rewards.arenaPoints && rewards.arenaPoints > 0) {
      await this.credit(
        userId,
        CurrencyType.ARENA_POINTS,
        rewards.arenaPoints,
        reason,
        missionId,
      );
    }
  }

  /**
   * Record verified income proof
   */
  async recordIncomeProof(
    userId: string,
    amount: number,
    incomeRecordId: string,
  ): Promise<TransactionResult> {
    return this.credit(
      userId,
      CurrencyType.INCOME_PROOF,
      amount,
      `Verified income: ${incomeRecordId}`,
    );
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    currencyType?: CurrencyType,
    limit: number = 50,
  ) {
    return this.prisma.currencyLedger.findMany({
      where: {
        userId,
        ...(currencyType && { currencyType }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        currencyType: true,
        amount: true,
        reason: true,
        missionId: true,
        createdAt: true,
      },
    });
  }

  /**
   * Check if user can afford a power-up
   */
  async canAfford(
    userId: string,
    currencyType: CurrencyType,
    cost: number,
  ): Promise<boolean> {
    const balance = await this.getBalanceForType(userId, currencyType);
    return balance >= cost;
  }
}
