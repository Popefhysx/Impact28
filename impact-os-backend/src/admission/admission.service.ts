import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService, OfferEmailData } from '../email';
import { ApplicantStatus, ConditionalTaskType, RejectionReason } from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Admission Service
 * 
 * Handles post-scoring actions:
 * - Sending admission/rejection emails
 * - Creating conditional tasks for CONDITIONAL applicants
 * - Converting admitted applicants to users
 */

interface ConditionalTaskConfig {
    type: ConditionalTaskType;
    description: string;
    daysToComplete: number;
}

// Default conditional tasks by risk flag
const CONDITIONAL_TASK_MAP: Record<string, ConditionalTaskConfig> = {
    LOW_ACTION_ORIENTATION: {
        type: ConditionalTaskType.WHY_STATEMENT,
        description: 'Write a 200-word statement explaining why you want to join and what action you will take in your first week.',
        daysToComplete: 7,
    },
    WEAK_COMMITMENT_SIGNAL: {
        type: ConditionalTaskType.TIME_AUDIT,
        description: 'Complete a 7-day time audit showing how you will dedicate 10+ hours weekly to learning.',
        daysToComplete: 7,
    },
    LIMITED_TIME_COMMITMENT: {
        type: ConditionalTaskType.TIME_AUDIT,
        description: 'Document your weekly schedule and identify at least 10 hours you can commit to training.',
        daysToComplete: 5,
    },
    SHARED_DEVICE: {
        type: ConditionalTaskType.OUTREACH_PROOF,
        description: 'Show proof of a plan to secure consistent device access (borrowed laptop, cybercafe schedule, etc.).',
        daysToComplete: 7,
    },
    DEFAULT: {
        type: ConditionalTaskType.INTRO_QUIZ,
        description: 'Complete the introductory quiz to demonstrate your commitment.',
        daysToComplete: 7,
    },
};

@Injectable()
export class AdmissionService {
    private readonly logger = new Logger(AdmissionService.name);
    private readonly baseUrl = process.env.FRONTEND_URL || 'https://cycle28.org';

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Process admission decision after scoring
     */
    async processAdmission(applicantId: string): Promise<void> {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
            select: {
                id: true,
                email: true,
                firstName: true,
                status: true,
                skillTrack: true,
                riskFlags: true,
                rejectionReason: true,
                readinessScore: true,
                diagnosticReport: true,
                // Assessment data for offer email
                offerType: true,
                triadTechnical: true,
                triadSoft: true,
                triadCommercial: true,
                primaryFocus: true,
                receivesStipend: true,
                kpiTargets: true,
            },
        });

        if (!applicant) {
            this.logger.error(`Applicant ${applicantId} not found`);
            return;
        }

        switch (applicant.status) {
            case ApplicantStatus.ADMITTED:
                await this.handleAdmission(applicant);
                break;

            case ApplicantStatus.CONDITIONAL:
                await this.handleConditional(applicant);
                break;

            case ApplicantStatus.WAITLIST:
                // Waitlist doesn't get immediate email, handled separately
                this.logger.log(`Applicant ${applicantId} added to waitlist`);
                break;

            case ApplicantStatus.REJECTED:
                await this.handleRejection(applicant);
                break;

            default:
                this.logger.warn(`Unexpected status ${applicant.status} for ${applicantId}`);
        }
    }

    /**
     * Handle full admission - send personalized offer email
     */
    private async handleAdmission(applicant: {
        id: string;
        email: string;
        firstName: string;
        skillTrack: string | null;
        offerType: string | null;
        triadTechnical: number | null;
        triadSoft: number | null;
        triadCommercial: number | null;
        primaryFocus: string | null;
        receivesStipend: boolean | null;
        kpiTargets: any;
    }): Promise<void> {
        // Generate secure offer token
        const offerToken = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

        // Store token
        await this.prisma.applicant.update({
            where: { id: applicant.id },
            data: {
                offerToken,
                offerTokenExpiresAt: expiresAt,
            },
        });

        const acceptLink = `${this.baseUrl}/apply/accept/${offerToken}`;
        const declineLink = `${this.baseUrl}/apply/decline/${offerToken}`;

        // Send personalized offer email with Skill Triad
        const offerData: OfferEmailData = {
            firstName: applicant.firstName,
            offerType: applicant.offerType || 'FULL_SUPPORT',
            triadTechnical: applicant.triadTechnical || 50,
            triadSoft: applicant.triadSoft || 50,
            triadCommercial: applicant.triadCommercial || 50,
            primaryFocus: applicant.primaryFocus || 'COMMERCIAL',
            receivesStipend: applicant.receivesStipend || false,
            kpiTargets: applicant.kpiTargets,
            acceptLink,
            declineLink,
        };

        await this.emailService.sendOfferEmail(applicant.email, offerData);

        this.logger.log(`Sent personalized offer email to ${applicant.email} (token: ${offerToken.substring(0, 8)}...)`);
    }

    /**
     * Handle conditional admission - create task and send email
     */
    private async handleConditional(applicant: {
        id: string;
        email: string;
        firstName: string;
        riskFlags: string[];
    }): Promise<void> {
        // Determine which conditional task to assign based on risk flags
        const taskConfig = this.determineConditionalTask(applicant.riskFlags);

        // Create the conditional task
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + taskConfig.daysToComplete);

        await this.prisma.conditionalTask.create({
            data: {
                applicantId: applicant.id,
                type: taskConfig.type,
                deadline,
            },
        });

        // Send conditional email
        const dashboardLink = `${this.baseUrl}/apply/conditional/${applicant.id}`;

        await this.emailService.sendConditionalEmail(
            applicant.email,
            applicant.firstName,
            dashboardLink,
            taskConfig.description,
        );

        this.logger.log(`Created conditional task ${taskConfig.type} for ${applicant.email}`);
    }

    /**
     * Handle rejection - send readiness-tiered rejection email
     */
    private async handleRejection(applicant: {
        id: string;
        email: string;
        firstName: string;
        rejectionReason: RejectionReason | null;
        readinessScore?: number | null;
        diagnosticReport?: any;
    }): Promise<void> {
        // Extract custom message and capacity flag from diagnostic report
        const diagnostics = applicant.diagnosticReport || {};
        const customMessage = diagnostics.customMessage;
        const isCapacityRejection = diagnostics.isCapacityRejection || false;
        const readinessScore = applicant.readinessScore ?? 50;

        // Determine primary gap from rejection reason
        const primaryGap = this.mapRejectionToGap(applicant.rejectionReason);

        await this.emailService.sendReadinessRejectionEmail(
            applicant.email,
            {
                firstName: applicant.firstName,
                readinessScore,
                primaryGap,
                isCapacityRejection,
                customMessage,
            }
        );

        this.logger.log(`Sent readiness-tiered rejection email to ${applicant.email} (score: ${readinessScore})`);
    }

    /**
     * Map rejection reason to a human-readable primary gap
     */
    private mapRejectionToGap(reason: RejectionReason | null): string | undefined {
        if (!reason) return undefined;

        const gapMap: Partial<Record<RejectionReason, string>> = {
            LOW_READINESS: 'overall readiness',
            NO_DEVICE: 'device access',
            NO_INTERNET: 'internet connectivity',
            NO_CONSENT: 'commitment level',
            INCOMPLETE_FORM: 'application completion',
        };

        return gapMap[reason];
    }

    /**
     * Determine which conditional task to assign based on risk flags
     */
    private determineConditionalTask(riskFlags: string[]): ConditionalTaskConfig {
        // Priority order: most critical flags first
        const priorityOrder = [
            'LOW_ACTION_ORIENTATION',
            'WEAK_COMMITMENT_SIGNAL',
            'LIMITED_TIME_COMMITMENT',
            'SHARED_DEVICE',
        ];

        for (const flag of priorityOrder) {
            if (riskFlags.includes(flag) && CONDITIONAL_TASK_MAP[flag]) {
                return CONDITIONAL_TASK_MAP[flag];
            }
        }

        return CONDITIONAL_TASK_MAP.DEFAULT;
    }

    /**
     * Format rejection reason for email
     */
    private formatRejectionReason(reason: RejectionReason | null): string | undefined {
        if (!reason) return undefined;

        const reasonMap: Record<RejectionReason, string> = {
            [RejectionReason.AGE_INELIGIBLE]: 'Our program is designed for participants aged 18-30.',
            [RejectionReason.LOCATION_UNSUPPORTED]: 'We currently only operate in Nigeria.',
            [RejectionReason.LOW_READINESS]: 'Based on your responses, we believe you may need more time to prepare for this commitment.',
            [RejectionReason.INCOMPLETE_FORM]: 'Your application was incomplete.',
            [RejectionReason.DUPLICATE]: 'We found a duplicate application.',
            [RejectionReason.NO_DEVICE]: 'Consistent device access is required for this program.',
            [RejectionReason.NO_INTERNET]: 'Reliable internet access is required for this program.',
            [RejectionReason.NO_CONSENT]: 'You did not agree to the required program commitments.',
            [RejectionReason.STAFF_DECISION]: 'This decision was made after careful review by our team.',
        };

        return reasonMap[reason] || undefined;
    }

    /**
     * Submit proof for a conditional task
     */
    async submitConditionalProof(
        applicantId: string,
        taskId: string,
        proofUrl: string,
    ): Promise<boolean> {
        const task = await this.prisma.conditionalTask.findFirst({
            where: {
                id: taskId,
                applicantId: applicantId,
                completed: false,
            },
        });

        if (!task) {
            return false;
        }

        // Check if deadline passed
        if (new Date() > task.deadline) {
            this.logger.warn(`Conditional task ${taskId} deadline passed`);
            return false;
        }

        // Mark task as completed
        await this.prisma.conditionalTask.update({
            where: { id: taskId },
            data: {
                completed: true,
                proofUrl,
                submittedAt: new Date(),
            },
        });

        // Upgrade applicant to ADMITTED
        const applicant = await this.prisma.applicant.update({
            where: { id: applicantId },
            data: { status: ApplicantStatus.ADMITTED },
            select: {
                email: true,
                firstName: true,
                skillTrack: true,
            },
        });

        // Send admission email
        const dashboardLink = `${this.baseUrl}/dashboard`;
        await this.emailService.sendAdmissionEmail(
            applicant.email,
            applicant.firstName,
            dashboardLink,
            applicant.skillTrack ?? undefined,
        );

        this.logger.log(`Conditional task ${taskId} completed, upgraded to ADMITTED`);

        return true;
    }

    /**
     * Get pending conditional tasks for an applicant
     */
    async getPendingTasks(applicantId: string) {
        return this.prisma.conditionalTask.findMany({
            where: {
                applicantId,
                completed: false,
            },
            select: {
                id: true,
                type: true,
                deadline: true,
                createdAt: true,
            },
        });
    }
}
