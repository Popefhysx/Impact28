import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeSource, ProofType, VerificationStatus } from '@prisma/client';

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

    // User endpoints
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

    // Admin endpoints
    @Get('admin/pending')
    async getPendingReviews(@Query('limit') limit?: number) {
        return this.incomeService.getPendingReviews(limit);
    }

    @Post('admin/:recordId/approve')
    async approveIncome(
        @Param('recordId') recordId: string,
        @Body('adminId') adminId: string,
    ) {
        return this.incomeService.approveIncome(recordId, adminId);
    }

    @Post('admin/:recordId/reject')
    async rejectIncome(
        @Param('recordId') recordId: string,
        @Body() dto: RejectIncomeDto & { adminId: string },
    ) {
        return this.incomeService.rejectIncome(recordId, dto.adminId, dto.reason);
    }

    // Public leaderboard
    @Get('leaderboard')
    async getLeaderboard(@Query('limit') limit?: number) {
        return this.incomeService.getIncomeLeaderboard(limit || 10);
    }
}
