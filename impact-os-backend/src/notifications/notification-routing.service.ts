import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

export type NotificationType =
    | 'testimonials'
    | 'partners'
    | 'applications'
    | 'income'
    | 'support'
    | 'critical';

@Injectable()
export class NotificationRoutingService {
    private readonly logger = new Logger(NotificationRoutingService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get email addresses of staff who should receive a specific notification type
     * Currently routes all notifications to super admins
     * TODO: Implement notification preferences once the column is added to the schema
     */
    async getRecipients(type: NotificationType): Promise<string[]> {
        // For now, all notifications go to super admins
        // Future: Check staff.notificationPrefs once the column exists
        this.logger.log(`Getting recipients for ${type} notifications`);
        return this.getSuperAdminEmails();
    }

    /**
     * Get all super admin email addresses
     */
    async getSuperAdminEmails(): Promise<string[]> {
        const superAdmins = await this.prisma.staff.findMany({
            where: {
                isActive: true,
                isSuperAdmin: true,
            },
            include: {
                user: { select: { email: true } },
            },
        });

        const emails = superAdmins.map((s) => s.user.email);
        this.logger.log(`Found ${emails.length} super admin(s) for notifications`);
        return emails;
    }

    /**
     * Check if a specific staff member should receive a notification
     * Currently returns true for super admins only
     */
    async shouldReceive(staffId: string, type: NotificationType): Promise<boolean> {
        const staff = await this.prisma.staff.findUnique({
            where: { id: staffId },
            select: { isSuperAdmin: true },
        });

        if (!staff) return false;

        // Super admins receive all notifications
        return staff.isSuperAdmin;
    }
}
