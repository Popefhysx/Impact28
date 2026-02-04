import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { TestimonialStatus, ApplicantStatus, VerificationStatus, InquiryStatus } from '@prisma/client';

export interface NotificationItem {
    id: string;
    type: 'testimonial' | 'partner' | 'application' | 'income' | 'in_app';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    link?: string;
}

export interface PendingCounts {
    testimonials: number;
    partners: number;
    applications: number;
    income: number;
    total: number;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get count of all pending items requiring admin action
     */
    async getUnreadCount(userId: string): Promise<number> {
        const counts = await this.getPendingCounts();
        return counts.total;
    }

    /**
     * Get detailed counts of all pending items
     */
    async getPendingCounts(): Promise<PendingCounts> {
        const [testimonials, partners, applications, income] = await Promise.all([
            // Pending testimonials
            this.prisma.testimonial.count({
                where: { status: TestimonialStatus.PENDING },
            }),
            // New partner inquiries
            this.prisma.partnerInquiry.count({
                where: { status: InquiryStatus.NEW },
            }).catch(() => 0), // May not exist
            // Pending applications
            this.prisma.applicant.count({
                where: { status: ApplicantStatus.PENDING },
            }),
            // Pending income reviews
            this.prisma.incomeRecord.count({
                where: { status: VerificationStatus.SUBMITTED },
            }),
        ]);

        return {
            testimonials,
            partners,
            applications,
            income,
            total: testimonials + partners + applications + income,
        };
    }

    /**
     * Get list of notification items for admin
     */
    async getNotifications(userId: string, limit: number = 20): Promise<NotificationItem[]> {
        const notifications: NotificationItem[] = [];

        // Get pending testimonials as notifications
        const pendingTestimonials = await this.prisma.testimonial.findMany({
            where: { status: TestimonialStatus.PENDING },
            orderBy: { submittedAt: 'desc' },
            take: 5,
            select: { id: true, name: true, quote: true, submittedAt: true },
        });

        for (const testimonial of pendingTestimonials) {
            notifications.push({
                id: `testimonial-${testimonial.id}`,
                type: 'testimonial',
                title: 'New Testimonial',
                message: `${testimonial.name}: "${testimonial.quote.substring(0, 60)}..."`,
                read: false,
                createdAt: testimonial.submittedAt,
                link: '/admin/testimonials',
            });
        }

        // Get pending applications as notifications
        const pendingApplications = await this.prisma.applicant.findMany({
            where: { status: ApplicantStatus.PENDING },
            orderBy: { submittedAt: 'desc' },
            take: 5,
            select: { id: true, firstName: true, lastName: true, submittedAt: true },
        });

        for (const app of pendingApplications) {
            if (app.submittedAt) {
                notifications.push({
                    id: `application-${app.id}`,
                    type: 'application',
                    title: 'New Application',
                    message: `${app.firstName} ${app.lastName} submitted an application`,
                    read: false,
                    createdAt: app.submittedAt,
                    link: '/admin/applicants',
                });
            }
        }

        // Get pending income reviews as notifications
        const pendingIncome = await this.prisma.incomeRecord.findMany({
            where: { status: VerificationStatus.SUBMITTED },
            orderBy: { submittedAt: 'desc' },
            take: 5,
            include: { user: { select: { firstName: true, lastName: true } } },
        });

        for (const income of pendingIncome) {
            notifications.push({
                id: `income-${income.id}`,
                type: 'income',
                title: 'Income Pending Review',
                message: `${income.user.firstName} ${income.user.lastName}: $${Number(income.amountUSD || 0).toFixed(2)}`,
                read: false,
                createdAt: income.submittedAt || new Date(),
                link: '/admin/income',
            });
        }

        // Sort by date and limit
        return notifications
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    /**
     * Mark a notification as read
     * For now, this is a no-op since notifications are derived from pending items
     * In future, we could track read state in a separate table
     */
    async markAsRead(notificationId: string): Promise<void> {
        this.logger.debug(`Mark as read: ${notificationId}`);
        // TODO: Implement read tracking if needed
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        this.logger.debug(`Mark all as read for user: ${userId}`);
        // TODO: Implement read tracking if needed
    }
}
