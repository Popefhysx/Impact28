import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UpdateCohortConfigDto } from './dto';

@Injectable()
export class CohortConfigService {
    constructor(private prisma: PrismaService) { }

    // Get active cohort configuration (public - for frontend)
    async getActiveConfig() {
        // Find the active cohort with its config
        const activeCohort = await this.prisma.cohort.findFirst({
            where: { isActive: true },
            include: { config: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!activeCohort || !activeCohort.config) {
            // Return default config if none exists
            return {
                cohortName: 'Cohort 5',
                applicationsOpen: true,
                openDate: null,
                closeDate: null,
                disabledTracks: [],
                founderMessageTitle: 'Welcome to the Journey!',
                founderMessageBody: "I'm so excited to have you join us. You've taken the first step toward transforming your future. Check your email for next steps, and remember: every expert was once a beginner.",
                founderName: 'Pope',
                founderImageUrl: '/images/Pope.png',
                founderSignatureUrl: '/images/sig.png',
                waitlistEnabled: true,
            };
        }

        return {
            cohortName: activeCohort.name,
            applicationsOpen: activeCohort.config.applicationsOpen,
            openDate: activeCohort.config.openDate,
            closeDate: activeCohort.config.closeDate,
            disabledTracks: activeCohort.config.disabledTracks,
            founderMessageTitle: activeCohort.config.founderMessageTitle,
            founderMessageBody: activeCohort.config.founderMessageBody,
            founderName: activeCohort.config.founderName,
            founderImageUrl: activeCohort.config.founderImageUrl || '/images/Pope.png',
            founderSignatureUrl: activeCohort.config.founderSignatureUrl || '/images/sig.png',
            waitlistEnabled: activeCohort.config.waitlistEnabled,
        };
    }

    // Admin: Get config for specific cohort
    async getConfigByCohortId(cohortId: string) {
        const config = await this.prisma.cohortConfig.findUnique({
            where: { cohortId },
            include: { cohort: true },
        });

        if (!config) {
            throw new NotFoundException('Config not found for this cohort');
        }

        return config;
    }

    // Admin: Update cohort configuration
    async updateConfig(cohortId: string, dto: UpdateCohortConfigDto, updatedBy: string) {
        // Upsert - create if doesn't exist, update if it does
        return this.prisma.cohortConfig.upsert({
            where: { cohortId },
            update: {
                ...dto,
                openDate: dto.openDate ? new Date(dto.openDate) : undefined,
                closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
                updatedBy,
            },
            create: {
                cohortId,
                applicationsOpen: dto.applicationsOpen ?? true,
                openDate: dto.openDate ? new Date(dto.openDate) : null,
                closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
                disabledTracks: dto.disabledTracks ?? [],
                founderMessageTitle: dto.founderMessageTitle,
                founderMessageBody: dto.founderMessageBody,
                founderName: dto.founderName,
                founderImageUrl: dto.founderImageUrl,
                founderSignatureUrl: dto.founderSignatureUrl,
                waitlistEnabled: dto.waitlistEnabled ?? true,
                updatedBy,
            },
        });
    }

    // Admin: List all cohorts with their configs
    async getAllCohorts() {
        return this.prisma.cohort.findMany({
            include: {
                config: true,
                _count: { select: { applicants: true, users: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Admin: Create new cohort
    async createCohort(name: string, startDate: Date, capacity: number = 50) {
        return this.prisma.cohort.create({
            data: {
                name,
                startDate,
                capacity,
                config: {
                    create: {
                        applicationsOpen: true,
                        waitlistEnabled: true,
                    },
                },
            },
            include: { config: true },
        });
    }
}
