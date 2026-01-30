import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { PrismaService } from '../prisma';
import { CapabilityGuard, RequireCapability } from '../staff/guards';

@Controller('conditional')
export class AdmissionController {
    constructor(
        private readonly admissionService: AdmissionService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Get pending conditional tasks for an applicant
     */
    @Get('tasks/:applicantId')
    async getPendingTasks(@Param('applicantId') applicantId: string) {
        // Verify applicant exists and is CONDITIONAL
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
            select: {
                id: true,
                firstName: true,
                email: true,
                status: true,
            },
        });

        if (!applicant) {
            throw new NotFoundException('Applicant not found');
        }

        if (applicant.status !== 'CONDITIONAL') {
            throw new BadRequestException('Applicant does not have conditional status');
        }

        const tasks = await this.admissionService.getPendingTasks(applicantId);

        return {
            applicant: {
                id: applicant.id,
                firstName: applicant.firstName,
                email: applicant.email,
            },
            tasks,
        };
    }

    /**
     * Get a specific conditional task details
     */
    @Get('task/:taskId')
    async getTaskDetails(@Param('taskId') taskId: string) {
        const task = await this.prisma.conditionalTask.findUnique({
            where: { id: taskId },
            include: {
                applicant: {
                    select: {
                        id: true,
                        firstName: true,
                        email: true,
                        status: true,
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Get task type descriptions
        const taskDescriptions: Record<string, { title: string; description: string; instructions: string[] }> = {
            WHY_STATEMENT: {
                title: 'Why Statement',
                description: 'Write a 200-word statement explaining why you want to join Cycle 28 and how this opportunity aligns with your goals.',
                instructions: [
                    'Be specific about your goals and motivations',
                    'Explain how Cycle 28 fits into your broader plan',
                    'Describe what you hope to achieve in 90 days',
                    'Share any challenges you\'re prepared to overcome',
                ],
            },
            TIME_AUDIT: {
                title: 'Weekly Time Audit',
                description: 'Complete a time audit showing how you will dedicate 15+ hours weekly to the program.',
                instructions: [
                    'List your current weekly commitments',
                    'Identify specific time blocks for Cycle 28 activities',
                    'Show at least 15 hours of available time',
                    'Include backup time slots for flexibility',
                ],
            },
            OUTREACH_PROOF: {
                title: 'Outreach Proof',
                description: 'Demonstrate initiative by conducting outreach to 3 potential clients or collaborators.',
                instructions: [
                    'Reach out to 3 different people in your target market',
                    'Screenshot your messages or emails',
                    'Document any responses received',
                    'Reflect on what you learned from the exercise',
                ],
            },
            INTRO_QUIZ: {
                title: 'Program Introduction Quiz',
                description: 'Complete a short quiz demonstrating your understanding of the Cycle 28 program.',
                instructions: [
                    'Review the program materials provided',
                    'Answer all questions thoughtfully',
                    'Score at least 80% to pass',
                ],
            },
        };

        const typeInfo = taskDescriptions[task.type] || {
            title: task.type,
            description: 'Complete this task to proceed with your application.',
            instructions: ['Follow the instructions provided'],
        };

        return {
            id: task.id,
            type: task.type,
            ...typeInfo,
            completed: task.completed,
            proofUrl: task.proofUrl,
            submittedAt: task.submittedAt,
            deadline: task.deadline,
            createdAt: task.createdAt,
            isOverdue: new Date() > task.deadline && !task.completed,
            applicant: task.applicant,
        };
    }

    /**
     * Submit proof for a conditional task
     */
    @Post('submit/:taskId')
    async submitProof(
        @Param('taskId') taskId: string,
        @Body('applicantId') applicantId: string,
        @Body('proofUrl') proofUrl: string,
        @Body('proofText') proofText?: string,
    ) {
        if (!applicantId) {
            throw new BadRequestException('Applicant ID is required');
        }

        if (!proofUrl && !proofText) {
            throw new BadRequestException('Proof URL or text is required');
        }

        // If only text is provided, we'll store it directly
        const proof = proofUrl || `text://${Buffer.from(proofText || '').toString('base64')}`;

        const success = await this.admissionService.submitConditionalProof(
            applicantId,
            taskId,
            proof,
        );

        if (!success) {
            throw new BadRequestException('Failed to submit proof. Task may not exist, already completed, or deadline passed.');
        }

        return {
            success: true,
            message: 'Task completed successfully. You have been admitted to the program!',
        };
    }

    /**
     * Admin: Get all conditional tasks pending review
     */
    @Get('admin/pending')
    @UseGuards(CapabilityGuard)
    @RequireCapability('admissions.manage')
    async getPendingForReview() {
        const tasks = await this.prisma.conditionalTask.findMany({
            where: {
                completed: true,
                applicant: {
                    status: 'ADMITTED',
                },
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        skillTrack: true,
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
            take: 50,
        });

        return tasks;
    }

    /**
     * Admin: Get overdue conditional tasks
     */
    @Get('admin/overdue')
    @UseGuards(CapabilityGuard)
    @RequireCapability('admissions.manage')
    async getOverdueTasks() {
        const tasks = await this.prisma.conditionalTask.findMany({
            where: {
                completed: false,
                deadline: {
                    lt: new Date(),
                },
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                deadline: 'asc',
            },
        });

        return tasks;
    }
}
