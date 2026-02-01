import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ProgressService, DashboardProgress, WeeklyStats } from './progress.service';

/**
 * Progress Controller
 * 
 * Provides REST endpoints for participant dashboard data.
 */
@Controller('api/progress')
export class ProgressController {
    constructor(private progressService: ProgressService) { }

    /**
     * GET /api/progress
     * Get full dashboard progress for authenticated user
     */
    @Get()
    async getProgress(@Req() req: any): Promise<DashboardProgress> {
        const userId = req.user?.id || req.user?.userId;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        return this.progressService.getDashboardProgress(userId);
    }

    /**
     * GET /api/progress/weekly
     * Get weekly statistics for authenticated user
     */
    @Get('weekly')
    async getWeeklyStats(@Req() req: any): Promise<WeeklyStats> {
        const userId = req.user?.id || req.user?.userId;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        return this.progressService.getWeeklyStats(userId);
    }

    /**
     * GET /api/progress/history
     * Get identity history for authenticated user
     */
    @Get('history')
    async getIdentityHistory(@Req() req: any) {
        const userId = req.user?.id || req.user?.userId;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        return this.progressService.getIdentityHistory(userId);
    }

    /**
     * GET /api/progress/leaderboard
     * Get cohort leaderboard for authenticated user
     */
    @Get('leaderboard')
    async getLeaderboard(@Req() req: any) {
        const userId = req.user?.id || req.user?.userId;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Get user's cohort
        const user = await this.progressService['prisma'].user.findUnique({
            where: { id: userId },
            select: { cohortId: true },
        });

        if (!user?.cohortId) {
            return [];
        }

        return this.progressService.getCohortLeaderboard(user.cohortId);
    }
}
