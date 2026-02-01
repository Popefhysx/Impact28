import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { TemplateStatus, CommunicationSource, Prisma } from '@prisma/client';

export interface TemplateVariable {
    name: string;
    description: string;
    required: boolean;
}

export interface CreateTemplateDto {
    name: string;
    slug: string;
    description?: string;
    category: CommunicationSource;
    subject: string;
    htmlContent: string;
    variables?: TemplateVariable[];
    isSystem?: boolean;
}

export interface UpdateTemplateDto {
    name?: string;
    description?: string;
    subject?: string;
    htmlContent?: string;
    variables?: TemplateVariable[];
}

@Injectable()
export class EmailTemplatesService {
    private readonly logger = new Logger(EmailTemplatesService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get all templates, optionally filtered by category
     */
    async findAll(category?: CommunicationSource) {
        return this.prisma.communicationTemplate.findMany({
            where: {
                ...(category && { category }),
                isActive: true,
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    /**
     * Get a single template by ID
     */
    async findById(id: string) {
        const template = await this.prisma.communicationTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Template ${id} not found`);
        }

        return template;
    }

    /**
     * Get a template by slug (for system use)
     */
    async findBySlug(slug: string) {
        return this.prisma.communicationTemplate.findUnique({
            where: { slug },
        });
    }

    /**
     * Get the approved template for a given slug
     * If none approved, returns null (caller should use fallback)
     */
    async getApprovedTemplate(slug: string) {
        const template = await this.prisma.communicationTemplate.findFirst({
            where: {
                slug,
                status: TemplateStatus.APPROVED,
                isActive: true,
            },
        });

        return template;
    }

    /**
     * Create a new template (starts as DRAFT)
     */
    async create(dto: CreateTemplateDto, createdBy?: string) {
        return this.prisma.communicationTemplate.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                category: dto.category,
                subject: dto.subject,
                htmlContent: dto.htmlContent,
                variables: (dto.variables || []) as unknown as Prisma.InputJsonValue,
                isSystem: dto.isSystem || false,
                status: TemplateStatus.DRAFT,
                createdBy,
            },
        });
    }

    /**
     * Update a template
     * If template was APPROVED, it goes to PENDING_APPROVAL
     * Stores the previous content for rollback
     */
    async update(id: string, dto: UpdateTemplateDto) {
        const template = await this.findById(id);

        // If template was approved, save current version as backup
        const shouldBackup = template.status === TemplateStatus.APPROVED;

        return this.prisma.communicationTemplate.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.subject && { subject: dto.subject }),
                ...(dto.htmlContent && { htmlContent: dto.htmlContent }),
                ...(dto.variables && { variables: dto.variables as unknown as Prisma.InputJsonValue }),
                // If was approved, mark as pending and backup
                ...(shouldBackup && {
                    status: TemplateStatus.PENDING_APPROVAL,
                    previousHtml: template.htmlContent,
                    previousSubject: template.subject,
                }),
                version: { increment: 1 },
            },
        });
    }

    /**
     * Approve a template (marks as APPROVED)
     */
    async approve(id: string, approvedBy: string) {
        const template = await this.findById(id);

        if (template.status === TemplateStatus.APPROVED) {
            this.logger.warn(`Template ${id} is already approved`);
            return template;
        }

        return this.prisma.communicationTemplate.update({
            where: { id },
            data: {
                status: TemplateStatus.APPROVED,
                approvedAt: new Date(),
                approvedBy,
                // Clear backup after approval
                previousHtml: null,
                previousSubject: null,
            },
        });
    }

    /**
     * Reject changes and revert to previous version
     */
    async reject(id: string) {
        const template = await this.findById(id);

        if (template.status !== TemplateStatus.PENDING_APPROVAL) {
            throw new Error('Only pending templates can be rejected');
        }

        // If we have backup, revert to it
        if (template.previousHtml) {
            return this.prisma.communicationTemplate.update({
                where: { id },
                data: {
                    status: TemplateStatus.APPROVED,
                    htmlContent: template.previousHtml,
                    subject: template.previousSubject || template.subject,
                    previousHtml: null,
                    previousSubject: null,
                },
            });
        }

        // Otherwise just mark as draft (new template that was never approved)
        return this.prisma.communicationTemplate.update({
            where: { id },
            data: { status: TemplateStatus.DRAFT },
        });
    }

    /**
     * Deprecate a template (soft delete)
     */
    async deprecate(id: string) {
        const template = await this.findById(id);

        if (template.isSystem) {
            throw new Error('System templates cannot be deprecated');
        }

        return this.prisma.communicationTemplate.update({
            where: { id },
            data: {
                status: TemplateStatus.DEPRECATED,
                isActive: false,
            },
        });
    }

    /**
     * Render a template with provided data
     * Uses simple {{variable}} replacement
     */
    renderTemplate(template: { subject: string; htmlContent: string }, data: Record<string, string | number>): { subject: string; html: string } {
        let subject = template.subject;
        let html = template.htmlContent;

        // Replace {{variable}} placeholders
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            subject = subject.replace(placeholder, String(value));
            html = html.replace(placeholder, String(value));
        }

        // Handle simple conditionals {{#if var}}...{{/if}}
        const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        html = html.replace(conditionalRegex, (_, varName, content) => {
            return data[varName] ? content : '';
        });
        subject = subject.replace(conditionalRegex, (_, varName, content) => {
            return data[varName] ? content : '';
        });

        return { subject, html };
    }

    /**
     * Preview a template with sample data
     */
    async preview(id: string, sampleData?: Record<string, string>) {
        const template = await this.findById(id);

        // Generate sample data from variables if not provided
        const variables = (template.variables as unknown as TemplateVariable[]) || [];
        const data: Record<string, string> = sampleData || {};

        for (const v of variables) {
            if (!data[v.name]) {
                // Generate sample value
                data[v.name] = `[${v.name}]`;
            }
        }

        return this.renderTemplate(template, data);
    }
}
