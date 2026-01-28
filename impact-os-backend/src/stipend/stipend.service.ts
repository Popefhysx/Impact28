import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import { IdentityLevel, CurrencyType } from '@prisma/client';

/**
 * Stipend Enforcement Service
 * 
 * Implements Impact OS stipend rules:
 * - Stipend is ACTION-GATED (not time-based)
 * - Users must maintain minimum momentum to receive stipend
 * - Inactivity triggers automatic pause
 * - Momentum thresholds unlock stipend tiers
 */

// Momentum thresholds for stipend eligibility
const MOMENTUM_THRESHOLDS = {
    MINIMUM: 50,      // Minimum to receive any stipend
    STANDARD: 100,    // Standard stipend rate
    BONUS: 200,       // Bonus eligibility
};

// Days of inactivity before auto-pause
const INACTIVITY_THRESHOLD_DAYS = 7;

// Stipend amounts in NGN
const STIPEND_AMOUNTS = {
    BASE: 5000,       // L1 base stipend
    STANDARD: 10000,  // L2+ standard
    SKILLED: 15000,   // L3 skilled
    EXPOSED: 20000,   // L4 exposed to market
};

export interface StipendEligibility {
    eligible: boolean;
    reason?: string;
    amount: number;
    tier: 'NONE' | 'BASE' | 'STANDARD' | 'BONUS';
    momentum: number;
    daysActive: number;
}

@Injectable()
export class StipendService {
    private readonly logger = new Logger(StipendService.name);

    constructor(
        private prisma: PrismaService,
        private currencyService: CurrencyService,
    ) { }

    /**
     * Check if user is eligible for stipend
     */
    async checkEligibility(userId: string): Promise<StipendEligibility> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                identityLevel: true,
                isActive: true,
                pausedAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            return { eligible: false, reason: 'User not found', amount: 0, tier: 'NONE', momentum: 0, daysActive: 0 };
        }

        // Check if user is paused
        if (!user.isActive) {
            return { eligible: false, reason: 'Account is paused', amount: 0, tier: 'NONE', momentum: 0, daysActive: 0 };
        }

        // Get current momentum
        const balance = await this.currencyService.getBalance(userId);
        const momentum = balance.momentum;

        // Calculate days active
        const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Check minimum momentum threshold
        if (momentum < MOMENTUM_THRESHOLDS.MINIMUM) {
            return {
                eligible: false,
                reason: `Momentum below minimum (${momentum}/${MOMENTUM_THRESHOLDS.MINIMUM})`,
                amount: 0,
                tier: 'NONE',
                momentum,
                daysActive,
            };
        }

        // Determine stipend tier and amount based on momentum and identity level
        const { tier, amount } = this.calculateStipendAmount(user.identityLevel, momentum);

        return {
            eligible: true,
            amount,
            tier,
            momentum,
            daysActive,
        };
    }

    /**
     * Calculate stipend amount based on identity level and momentum
     */
    private calculateStipendAmount(
        level: IdentityLevel,
        momentum: number,
    ): { tier: StipendEligibility['tier']; amount: number } {
        let baseAmount = STIPEND_AMOUNTS.BASE;

        // Higher levels get higher base amounts
        switch (level) {
            case IdentityLevel.L1_ACTIVATED:
                baseAmount = STIPEND_AMOUNTS.BASE;
                break;
            case IdentityLevel.L2_SKILLED:
                baseAmount = STIPEND_AMOUNTS.STANDARD;
                break;
            case IdentityLevel.L3_EXPOSED:
                baseAmount = STIPEND_AMOUNTS.SKILLED;
                break;
            case IdentityLevel.L4_EARNER:
            case IdentityLevel.L5_CATALYST:
                baseAmount = STIPEND_AMOUNTS.EXPOSED;
                break;
        }

        // Apply momentum multiplier
        if (momentum >= MOMENTUM_THRESHOLDS.BONUS) {
            return { tier: 'BONUS', amount: Math.floor(baseAmount * 1.5) };
        } else if (momentum >= MOMENTUM_THRESHOLDS.STANDARD) {
            return { tier: 'STANDARD', amount: baseAmount };
        } else {
            return { tier: 'BASE', amount: Math.floor(baseAmount * 0.5) };
        }
    }

    /**
     * Check and pause inactive users
     * Called by scheduled job
     */
    async checkInactiveUsers(): Promise<string[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

        // Find users who haven't completed any missions recently
        const inactiveUsers = await this.prisma.user.findMany({
            where: {
                isActive: true,
                missions: {
                    none: {
                        completedAt: { gte: cutoffDate },
                    },
                },
                // Only active participants (L1+)
                identityLevel: { not: IdentityLevel.L0_APPLICANT },
            },
            select: { id: true, email: true, firstName: true },
        });

        const pausedUserIds: string[] = [];

        for (const user of inactiveUsers) {
            // Check if they have sufficient momentum (safety net)
            const balance = await this.currencyService.getBalance(user.id);

            if (balance.momentum < MOMENTUM_THRESHOLDS.MINIMUM) {
                await this.pauseUser(user.id, 'Inactivity: No recent missions and low momentum');
                pausedUserIds.push(user.id);
                this.logger.warn(`Paused inactive user ${user.id} (${user.email})`);
            }
        }

        return pausedUserIds;
    }

    /**
     * Pause a user's account
     */
    async pauseUser(userId: string, reason: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                pausedAt: new Date(),
                pauseReason: reason,
            },
        });

        this.logger.log(`User ${userId} paused: ${reason}`);
    }

    /**
     * Reactivate a paused user (after they complete a reactivation task)
     */
    async reactivateUser(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true, pausedAt: true },
        });

        if (!user || user.isActive) {
            return false;
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: true,
                pausedAt: null,
                pauseReason: null,
            },
        });

        // Give them a small momentum boost to start
        await this.currencyService.credit(
            userId,
            CurrencyType.MOMENTUM,
            25,
            'Reactivation bonus',
        );

        this.logger.log(`User ${userId} reactivated`);

        return true;
    }

    /**
     * Apply daily momentum decay to all active users
     * Called by scheduled job
     */
    async applyDailyDecay(): Promise<number> {
        const activeUsers = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        let decayCount = 0;

        for (const user of activeUsers) {
            await this.currencyService.applyMomentumDecay(user.id, 0.05); // 5% daily decay
            decayCount++;
        }

        this.logger.log(`Applied momentum decay to ${decayCount} users`);

        return decayCount;
    }

    /**
     * Get user's stipend status summary
     */
    async getStipendStatus(userId: string) {
        const eligibility = await this.checkEligibility(userId);
        const history = await this.currencyService.getTransactionHistory(
            userId,
            CurrencyType.MOMENTUM,
            10,
        );

        return {
            ...eligibility,
            recentTransactions: history,
        };
    }
}
