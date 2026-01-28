import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import { ScoringService } from '../scoring';
import { StartApplicationDto, Section2Dto, Section3Dto, Section4Dto, Section5Dto, Section6Dto } from './dto';
import { ApplicantStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class IntakeService {
    private readonly logger = new Logger(IntakeService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private scoringService: ScoringService,
    ) { }

    // Start a new application (Section 1)
    async startApplication(dto: StartApplicationDto) {
        // Check for existing application
        const existing = await this.prisma.applicant.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            // If incomplete, return it for resumption
            if (existing.status === ApplicantStatus.STARTED || existing.status === ApplicantStatus.PARTIAL) {
                return {
                    id: existing.id,
                    status: existing.status,
                    completedSections: existing.completedSections,
                    message: 'Existing application found. You can continue where you left off.',
                    isResume: true,
                };
            }
            throw new ConflictException('An application with this email already exists.');
        }

        // Generate resume token
        const resumeToken = crypto.randomBytes(32).toString('hex');
        const resumeTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const applicant = await this.prisma.applicant.create({
            data: {
                ...dto,
                status: ApplicantStatus.STARTED,
                completedSections: 1,
                lastSectionAt: new Date(),
                resumeToken,
                resumeTokenExpiresAt,
            },
        });

        return {
            id: applicant.id,
            status: applicant.status,
            completedSections: applicant.completedSections,
            resumeToken: applicant.resumeToken,
            message: 'Application started successfully.',
            isResume: false,
        };
    }

    // Update Section 2
    async updateSection2(id: string, dto: Section2Dto) {
        const applicant = await this.findApplicant(id);
        this.validateSectionOrder(applicant.completedSections, 2);

        return this.prisma.applicant.update({
            where: { id },
            data: {
                ...dto,
                status: ApplicantStatus.PARTIAL,
                completedSections: Math.max(applicant.completedSections, 2),
                lastSectionAt: new Date(),
            },
            select: this.defaultSelect,
        });
    }

    // Update Section 3
    async updateSection3(id: string, dto: Section3Dto) {
        const applicant = await this.findApplicant(id);
        this.validateSectionOrder(applicant.completedSections, 3);

        return this.prisma.applicant.update({
            where: { id },
            data: {
                ...dto,
                completedSections: Math.max(applicant.completedSections, 3),
                lastSectionAt: new Date(),
            },
            select: this.defaultSelect,
        });
    }

    // Update Section 4
    async updateSection4(id: string, dto: Section4Dto) {
        const applicant = await this.findApplicant(id);
        this.validateSectionOrder(applicant.completedSections, 4);

        return this.prisma.applicant.update({
            where: { id },
            data: {
                ...dto,
                completedSections: Math.max(applicant.completedSections, 4),
                lastSectionAt: new Date(),
            },
            select: this.defaultSelect,
        });
    }

    // Update Section 5
    async updateSection5(id: string, dto: Section5Dto) {
        const applicant = await this.findApplicant(id);
        this.validateSectionOrder(applicant.completedSections, 5);

        return this.prisma.applicant.update({
            where: { id },
            data: {
                ...dto,
                completedSections: Math.max(applicant.completedSections, 5),
                lastSectionAt: new Date(),
            },
            select: this.defaultSelect,
        });
    }

    // Submit application (Section 6 - final)
    async submitApplication(id: string, dto: Section6Dto) {
        const applicant = await this.findApplicant(id);

        if (applicant.completedSections < 5) {
            throw new BadRequestException('Please complete all sections before submitting.');
        }

        // Validate all consents
        if (!dto.consentDailyAction || !dto.consentWeeklyCheckin || !dto.consentFailure || !dto.consentData) {
            throw new BadRequestException('All consent checkboxes must be checked to submit.');
        }

        const submitted = await this.prisma.applicant.update({
            where: { id },
            data: {
                ...dto,
                status: ApplicantStatus.PENDING,
                completedSections: 6,
                submittedAt: new Date(),
                lastSectionAt: new Date(),
            },
            select: {
                ...this.defaultSelect,
                email: true,
                firstName: true,
            },
        });

        // Send confirmation email
        await this.emailService.sendApplicationReceived(submitted.email, submitted.firstName);

        // Trigger AI scoring (async, non-blocking)
        this.scoringService.scoreApplicant(id)
            .then((result) => {
                this.logger.log(`Scored ${id}: ${result.recommendation} (${result.readinessScore.toFixed(2)})`);
            })
            .catch((error) => {
                this.logger.error(`Scoring failed for ${id}: ${error.message}`);
            });

        return {
            id: submitted.id,
            status: submitted.status,
            completedSections: submitted.completedSections,
            message: 'Application submitted successfully! We will review it within 48 hours.',
        };
    }

    // Resume application with token
    async resumeWithToken(token: string) {
        const applicant = await this.prisma.applicant.findFirst({
            where: {
                resumeToken: token,
                resumeTokenExpiresAt: { gt: new Date() },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                completedSections: true,
                status: true,
            },
        });

        if (!applicant) {
            throw new NotFoundException('Invalid or expired resume link.');
        }

        return {
            ...applicant,
            nextSection: applicant.completedSections + 1,
        };
    }

    // Get application status
    async getStatus(id: string) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                completedSections: true,
                readinessScore: true,
                aiRecommendation: true,
                rejectionReason: true,
                submittedAt: true,
            },
        });

        if (!applicant) {
            throw new NotFoundException('Application not found.');
        }

        return applicant;
    }

    // Get application by email (for resume)
    async findByEmail(email: string) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { email },
            select: {
                id: true,
                completedSections: true,
                status: true,
                resumeToken: true,
            },
        });

        if (!applicant) {
            throw new NotFoundException('No application found for this email.');
        }

        return applicant;
    }

    // Private helpers
    private async findApplicant(id: string) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id },
        });

        if (!applicant) {
            throw new NotFoundException('Application not found.');
        }

        if (applicant.status === ApplicantStatus.PENDING ||
            applicant.status === ApplicantStatus.ADMITTED ||
            applicant.status === ApplicantStatus.REJECTED) {
            throw new BadRequestException('This application has already been submitted and cannot be edited.');
        }

        return applicant;
    }

    private validateSectionOrder(completedSections: number, targetSection: number) {
        if (completedSections < targetSection - 1) {
            throw new BadRequestException(`Please complete section ${targetSection - 1} first.`);
        }
    }

    private defaultSelect = {
        id: true,
        status: true,
        completedSections: true,
        lastSectionAt: true,
    };
}
