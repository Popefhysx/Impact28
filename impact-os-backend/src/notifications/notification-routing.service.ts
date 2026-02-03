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
     * Falls back to super admins if no one is subscribed
     */
    async getRecipients(type: NotificationType): Promise<string[]> {
        // Find staff with this notification preference
        const staff = await this.prisma.staff.findMany({
            where: {
                isActive: true,
                notificationPrefs: { has: type },
            },
            include: {
                user: { select: { email: true } },
            },
        });

        if (staff.length > 0) {
            const emails = staff.map((s) => s.user.email);
            this.logger.log(`Found ${emails.length} recipient(s) for ${type} notifications`);
            return emails;
        }

        // Fallback to super admins
        this.logger.log(`No subscribers for ${type}, falling back to super admins`);
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

        return superAdmins.map((s) => s.user.email);
    }

    /**
     * Check if a specific staff member should receive a notification
     */
    async shouldReceive(staffId: string, type: NotificationType): Promise<boolean> {
        const staff = await this.prisma.staff.findUnique({
            where: { id: staffId },
            select: { notificationPrefs: true, isSuperAdmin: true },
        });

        if (!staff) return false;

        // Super admins always receive critical notifications
        if (type === 'critical' && staff.isSuperAdmin) return true;

        return staff.notificationPrefs.includes(type);
    }
}
