import { Controller, Get, Post, Param } from '@nestjs/common';
import { StipendService } from './stipend.service';

/**
 * Stipend Controller
 * 
 * REST endpoints for the Impact OS stipend system:
 * - Eligibility status
 * - Stipend history
 * - Account pause/reactivation
 */
@Controller('stipend')
export class StipendController {
    constructor(private stipendService: StipendService) { }

    /**
     * Get user's stipend eligibility status
     */
    @Get(':userId/status')
    async getStipendStatus(@Param('userId') userId: string) {
        return this.stipendService.getStipendStatus(userId);
    }

    /**
     * Get detailed eligibility breakdown
     */
    @Get(':userId/eligibility')
    async checkEligibility(@Param('userId') userId: string) {
        return this.stipendService.checkEligibility(userId);
    }

    /**
     * Reactivate a paused user
     */
    @Post(':userId/reactivate')
    async reactivateUser(@Param('userId') userId: string) {
        const success = await this.stipendService.reactivateUser(userId);
        return { success };
    }

    // ===== ADMIN/CRON ENDPOINTS =====

    /**
     * Trigger daily momentum decay
     * Called by cron job
     */
    @Post('admin/apply-decay')
    async applyDailyDecay() {
        const count = await this.stipendService.applyDailyDecay();
        return { usersProcessed: count };
    }

    /**
     * Check and pause inactive users
     * Called by cron job
     */
    @Post('admin/check-inactive')
    async checkInactiveUsers() {
        const pausedUserIds = await this.stipendService.checkInactiveUsers();
        return { pausedCount: pausedUserIds.length, pausedUserIds };
    }
}
