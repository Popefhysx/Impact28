import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeSource, ProofType, VerificationStatus } from '@prisma/client';
import { CapabilityGuard, RequireCapability } from '../staff/guards';

// DTOs
class SubmitIncomeDto {
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

class RejectIncomeDto {
    reason: string;
}

@Controller('income')
export class IncomeController {
    constructor(private incomeService: IncomeService) { }

    // User endpoints (no capability required - user's own data)
    @Post(':userId/submit')
    async submitIncome(
        @Param('userId') userId: string,
        @Body() dto: SubmitIncomeDto,
    ) {
        return this.incomeService.submitIncome(userId, dto);
    }

    @Get(':userId')
    async getUserIncome(
        @Param('userId') userId: string,
        @Query('status') status?: VerificationStatus,
    ) {
        return this.incomeService.getUserIncome(userId, status);
    }

    @Get(':userId/stats')
    async getUserStats(@Param('userId') userId: string) {
        return this.incomeService.getUserIncomeStats(userId);
    }

    // Admin endpoints - require capabilities
    @Get('admin/pending')
    @UseGuards(CapabilityGuard)
    @RequireCapability('income.review')
    async getPendingReviews(@Query('limit') limit?: number) {
        return this.incomeService.getPendingReviews(limit);
    }

    @Post('admin/:recordId/approve')
    @UseGuards(CapabilityGuard)
    @RequireCapability('income.approve')
    async approveIncome(
        @Param('recordId') recordId: string,
        @Body('adminId') adminId: string,
    ) {
        return this.incomeService.approveIncome(recordId, adminId);
    }

    @Post('admin/:recordId/reject')
    @UseGuards(CapabilityGuard)
    @RequireCapability('income.approve')
    async rejectIncome(
        @Param('recordId') recordId: string,
        @Body() dto: RejectIncomeDto & { adminId: string },
    ) {
        return this.incomeService.rejectIncome(recordId, dto.adminId, dto.reason);
    }

    // Public leaderboard (no guard)
    @Get('leaderboard')
    async getLeaderboard(@Query('limit') limit?: number) {
        return this.incomeService.getIncomeLeaderboard(limit || 10);
    }
}

