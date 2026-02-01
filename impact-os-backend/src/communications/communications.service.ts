import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DeliveryStatus, CommunicationSource } from '@prisma/client';

export interface CommunicationStats {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
}

export interface CommunicationLogItem {
    id: string;
    triggeredBy: string;
    triggerSource: CommunicationSource;
    templateType: string;
    subject: string;
    recipientEmail: string;
    recipientName: string | null;
    status: DeliveryStatus;
    sentAt: Date | null;
    failedAt: Date | null;
    failureReason: string | null;
    createdAt: Date;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable()
export class CommunicationsService {
    private readonly logger = new Logger(CommunicationsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get communication statistics
     */
    async getStats(): Promise<CommunicationStats> {
        const [total, sent, delivered, failed, pending] = await Promise.all([
            this.prisma.communicationLog.count(),
            this.prisma.communicationLog.count({ where: { status: DeliveryStatus.SENT } }),
            this.prisma.communicationLog.count({ where: { status: DeliveryStatus.DELIVERED } }),
            this.prisma.communicationLog.count({ where: { status: DeliveryStatus.FAILED } }),
            this.prisma.communicationLog.count({ where: { status: DeliveryStatus.QUEUED } }),
        ]);

        return { total, sent, delivered, failed, pending };
    }

    /**
     * Get paginated communication logs with optional filters
     */
    async getLogs(options: {
        page?: number;
        pageSize?: number;
        status?: DeliveryStatus;
        source?: CommunicationSource;
        search?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<PaginatedResponse<CommunicationLogItem>> {
        const {
            page = 1,
            pageSize = 20,
            status,
            source,
            search,
            startDate,
            endDate
        } = options;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (source) {
            where.triggerSource = source;
        }

        if (search) {
            where.OR = [
                { recipientEmail: { contains: search, mode: 'insensitive' } },
                { recipientName: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [data, total] = await Promise.all([
            this.prisma.communicationLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    triggeredBy: true,
                    triggerSource: true,
                    templateType: true,
                    subject: true,
                    recipientEmail: true,
                    recipientName: true,
                    status: true,
                    sentAt: true,
                    failedAt: true,
                    failureReason: true,
                    createdAt: true,
                },
            }),
            this.prisma.communicationLog.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    /**
     * Get failed emails for quick review
     */
    async getFailedEmails(limit = 20): Promise<CommunicationLogItem[]> {
        return this.prisma.communicationLog.findMany({
            where: { status: DeliveryStatus.FAILED },
            orderBy: { failedAt: 'desc' },
            take: limit,
            select: {
                id: true,
                triggeredBy: true,
                triggerSource: true,
                templateType: true,
                subject: true,
                recipientEmail: true,
                recipientName: true,
                status: true,
                sentAt: true,
                failedAt: true,
                failureReason: true,
                createdAt: true,
            },
        });
    }

    /**
     * Get a single communication log detail
     */
    async getLogDetail(id: string) {
        return this.prisma.communicationLog.findUnique({
            where: { id },
        });
    }

    /**
     * Retry sending a failed email
     * Note: This is a placeholder - actual implementation would need to
     * reconstruct the email and resend via EmailService
     */
    async retryEmail(id: string): Promise<{ success: boolean; message: string }> {
        const log = await this.prisma.communicationLog.findUnique({ where: { id } });

        if (!log) {
            return { success: false, message: 'Email log not found' };
        }

        if (log.status !== DeliveryStatus.FAILED) {
            return { success: false, message: 'Can only retry failed emails' };
        }

        // For now, just mark as queued for retry
        // Full implementation would need to store the original HTML or re-render
        this.logger.warn(`Retry requested for email ${id} - full retry not yet implemented`);

        return { success: false, message: 'Retry functionality coming in Phase 3' };
    }

    // =========================================================================
    // TEMPLATE MANAGEMENT
    // =========================================================================

    /**
     * Get all templates
     */
    async getTemplates(category?: CommunicationSource) {
        const where = category ? { category, isActive: true } : { isActive: true };
        return this.prisma.communicationTemplate.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get a single template by slug
     */
    async getTemplateBySlug(slug: string) {
        return this.prisma.communicationTemplate.findUnique({
            where: { slug },
        });
    }

    /**
     * Create a new template
     */
    async createTemplate(data: {
        name: string;
        slug: string;
        category: CommunicationSource;
        subject: string;
        htmlContent: string;
        variables?: Array<{ name: string; description?: string; required?: boolean }>;
        createdBy?: string;
    }) {
        return this.prisma.communicationTemplate.create({
            data: {
                name: data.name,
                slug: data.slug,
                category: data.category,
                subject: data.subject,
                htmlContent: data.htmlContent,
                variables: data.variables || [],
                createdBy: data.createdBy,
            },
        });
    }

    /**
     * Update an existing template
     */
    async updateTemplate(id: string, data: {
        name?: string;
        subject?: string;
        htmlContent?: string;
        variables?: Array<{ name: string; description?: string; required?: boolean }>;
        isActive?: boolean;
    }) {
        return this.prisma.communicationTemplate.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete a template (soft delete by deactivating)
     */
    async deleteTemplate(id: string) {
        const template = await this.prisma.communicationTemplate.findUnique({ where: { id } });

        if (!template) {
            return { success: false, message: 'Template not found' };
        }

        if (template.isSystem) {
            return { success: false, message: 'Cannot delete system templates' };
        }

        await this.prisma.communicationTemplate.update({
            where: { id },
            data: { isActive: false },
        });

        return { success: true, message: 'Template deleted' };
    }

    // =========================================================================
    // RECIPIENT LOOKUP (for Compose)
    // =========================================================================

    /**
     * Search for recipients across participants and applicants
     */
    async searchRecipients(query: string, type?: 'user' | 'applicant') {
        const results: Array<{
            id: string;
            name: string;
            email: string;
            type: 'user' | 'applicant';
        }> = [];

        if (!type || type === 'user') {
            const users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: 10,
                select: { id: true, firstName: true, lastName: true, email: true },
            });

            results.push(...users.map(u => ({
                id: u.id,
                name: `${u.firstName} ${u.lastName}`,
                email: u.email,
                type: 'user' as const,
            })));
        }

        if (!type || type === 'applicant') {
            const applicants = await this.prisma.applicant.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: 10,
                select: { id: true, firstName: true, lastName: true, email: true },
            });

            results.push(...applicants.map(a => ({
                id: a.id,
                name: `${a.firstName} ${a.lastName}`,
                email: a.email,
                type: 'applicant' as const,
            })));
        }

        return results;
    }

    // =========================================================================
    // SEGMENT BUILDER (for Bulk Sending)
    // =========================================================================

    /**
     * Get available cohorts for segment selection
     */
    async getCohorts() {
        return this.prisma.cohort.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get recipients by segment criteria
     */
    async getRecipientsBySegment(segment: {
        type: 'all' | 'cohort' | 'phase' | 'custom';
        cohortId?: string;
        phase?: string;
        customIds?: string[];
    }): Promise<Array<{ id: string; name: string; email: string }>> {
        let where: any = { isActive: true };

        if (segment.type === 'cohort' && segment.cohortId) {
            where.cohortId = segment.cohortId;
        } else if (segment.type === 'phase' && segment.phase) {
            where.currentPhase = segment.phase;
        } else if (segment.type === 'custom' && segment.customIds?.length) {
            where.id = { in: segment.customIds };
        }
        // 'all' uses just isActive: true

        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: { firstName: 'asc' },
        });

        return users.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
        }));
    }

    /**
     * Get segment count preview without fetching all recipients
     */
    async getSegmentCount(segment: {
        type: 'all' | 'cohort' | 'phase' | 'custom';
        cohortId?: string;
        phase?: string;
        customIds?: string[];
    }): Promise<number> {
        let where: any = { isActive: true };

        if (segment.type === 'cohort' && segment.cohortId) {
            where.cohortId = segment.cohortId;
        } else if (segment.type === 'phase' && segment.phase) {
            where.currentPhase = segment.phase;
        } else if (segment.type === 'custom' && segment.customIds?.length) {
            where.id = { in: segment.customIds };
        }

        return this.prisma.user.count({ where });
    }

    // =========================================================================
    // BULK SEND (Placeholder - actual sending via EmailService)
    // =========================================================================

    /**
     * Queue a bulk email send
     * Returns immediately with job ID, actual sending happens asynchronously
     */
    async queueBulkSend(data: {
        subject: string;
        htmlContent: string;
        segment: {
            type: 'all' | 'cohort' | 'phase' | 'custom';
            cohortId?: string;
            phase?: string;
            customIds?: string[];
        };
        triggeredBy: string;
    }): Promise<{ success: boolean; recipientCount: number; message: string }> {
        // Get recipients based on segment
        const recipients = await this.getRecipientsBySegment(data.segment);

        if (recipients.length === 0) {
            return { success: false, recipientCount: 0, message: 'No recipients match the selected segment' };
        }

        // For now, log the intent and return count
        // Full implementation would queue via Bull/BullMQ or background worker
        this.logger.log(`Bulk send queued: ${recipients.length} recipients by ${data.triggeredBy}`);
        this.logger.log(`Subject: ${data.subject}`);

        // Create placeholder logs for each recipient (QUEUED status)
        const logs = await Promise.all(
            recipients.map(recipient =>
                this.prisma.communicationLog.create({
                    data: {
                        triggeredBy: data.triggeredBy,
                        triggerSource: CommunicationSource.BROADCAST,
                        templateType: 'bulk_send',
                        templateVersion: 1,
                        subject: data.subject,
                        contentHash: this.hashContent(data.htmlContent),
                        contentPreview: this.extractPreview(data.htmlContent),
                        recipientEmail: recipient.email,
                        recipientName: recipient.name,
                        recipientId: recipient.id,
                        recipientType: 'USER',
                        status: DeliveryStatus.QUEUED,
                    },
                })
            )
        );

        this.logger.log(`Created ${logs.length} queued log entries`);

        return {
            success: true,
            recipientCount: recipients.length,
            message: `Queued ${recipients.length} emails for delivery`,
        };
    }

    // Helper: Hash content for integrity
    private hashContent(html: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(html).digest('hex').substring(0, 16);
    }

    // Helper: Extract preview text from HTML
    private extractPreview(html: string, maxLength = 200): string {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, maxLength);
    }
}

