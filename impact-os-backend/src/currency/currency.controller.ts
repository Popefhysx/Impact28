import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyType } from '@prisma/client';

/**
 * Currency Controller
 *
 * REST endpoints for the Impact OS currency system:
 * - Balance retrieval
 * - Transaction history
 * - Skill Triad scores
 */
@Controller('currency')
export class CurrencyController {
  constructor(private currencyService: CurrencyService) {}

  /**
   * Get user's balance for all 4 currencies
   */
  @Get(':userId/balance')
  async getBalance(@Param('userId') userId: string) {
    return this.currencyService.getBalance(userId);
  }

  /**
   * Get transaction history
   */
  @Get(':userId/history')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('type') currencyType?: CurrencyType,
    @Query('limit') limit?: string,
  ) {
    return this.currencyService.getTransactionHistory(
      userId,
      currencyType,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * Get Skill Triad scores
   * Calculates Technical / Soft / Commercial balance from XP
   */
  @Get(':userId/triad')
  async getSkillTriad(@Param('userId') userId: string) {
    const balance = await this.currencyService.getBalance(userId);

    // Calculate triad percentages based on skill domains
    // This is a simplified calculation - in production, track by domain
    const totalXp = balance.skillXp || 1;

    // For now, return balanced scores (will be enhanced with domain tracking)
    return {
      technical: Math.min(100, Math.round(totalXp / 3 / 10)),
      soft: Math.min(100, Math.round(totalXp / 3 / 10)),
      commercial: Math.min(100, Math.round(balance.arenaPoints / 10)),
      totalXp: balance.skillXp,
      arenaPoints: balance.arenaPoints,
      isBalanced: true,
      thresholdMet: {
        technical: false,
        soft: false,
        commercial: false,
      },
    };
  }
}
