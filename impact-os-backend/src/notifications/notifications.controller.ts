import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CapabilityGuard, RequireCapability } from '../staff/guards';

@Controller('api/notifications')
@UseGuards(CapabilityGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * GET /api/notifications
     * Get list of notifications for current user
     */
    @Get()
    @RequireCapability('reports.view')
    async getNotifications(@Req() req: any) {
        const userId = req.user?.id || 'admin';
        const notifications = await this.notificationsService.getNotifications(userId);
        return { notifications };
    }

    /**
     * GET /api/notifications/unread-count
     * Get count of unread notifications (pending items requiring action)
     */
    @Get('unread-count')
    @RequireCapability('reports.view')
    async getUnreadCount(@Req() req: any) {
        const userId = req.user?.id || 'admin';
        const count = await this.notificationsService.getUnreadCount(userId);
        return { count };
    }

    /**
     * GET /api/notifications/pending-counts
     * Get detailed breakdown of pending items by category
     */
    @Get('pending-counts')
    @RequireCapability('reports.view')
    async getPendingCounts() {
        return this.notificationsService.getPendingCounts();
    }

    /**
     * POST /api/notifications/:id/read
     * Mark a notification as read
     */
    @Post(':id/read')
    @RequireCapability('reports.view')
    async markAsRead(@Param('id') id: string) {
        await this.notificationsService.markAsRead(id);
        return { success: true };
    }

    /**
     * POST /api/notifications/mark-all-read
     * Mark all notifications as read
     */
    @Post('mark-all-read')
    @RequireCapability('reports.view')
    async markAllAsRead(@Req() req: any) {
        const userId = req.user?.id || 'admin';
        await this.notificationsService.markAllAsRead(userId);
        return { success: true };
    }
}
