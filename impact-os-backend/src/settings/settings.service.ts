import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreatePhaseDto,
    UpdatePhaseDto,
    ReorderPhasesDto,
    CreateCalendarEventDto,
    UpdateCalendarEventDto,
    UpdateProgramConfigDto,
    CreateCohortDto,
    UpdateCohortDto,
} from './dto';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    // =========================================================================
    // PHASES
    // =========================================================================

    async listPhases() {
        return this.prisma.phase.findMany({
            orderBy: { order: 'asc' },
        });
    }

    async createPhase(dto: CreatePhaseDto) {
        return this.prisma.phase.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                order: dto.order,
                durationDays: dto.durationDays ?? 7,
                description: dto.description,
            },
        });
    }

    async updatePhase(id: string, dto: UpdatePhaseDto) {
        return this.prisma.phase.update({
            where: { id },
            data: dto,
        });
    }

    async deletePhase(id: string) {
        return this.prisma.phase.delete({
            where: { id },
        });
    }

    async reorderPhases(dto: ReorderPhasesDto) {
        const updates = dto.orderedIds.map((id, index) =>
            this.prisma.phase.update({
                where: { id },
                data: { order: index + 1 },
            }),
        );
        await this.prisma.$transaction(updates);
        return this.listPhases();
    }

    // =========================================================================
    // CALENDAR EVENTS
    // =========================================================================

    async listCalendarEvents(cohortId?: string) {
        return this.prisma.calendarEvent.findMany({
            where: cohortId ? { cohortId } : undefined,
            orderBy: { date: 'asc' },
            include: { cohort: { select: { id: true, name: true } } },
        });
    }

    async createCalendarEvent(dto: CreateCalendarEventDto, createdBy?: string) {
        return this.prisma.calendarEvent.create({
            data: {
                title: dto.title,
                date: new Date(dto.date),
                time: dto.time,
                type: dto.type,
                description: dto.description,
                cohortId: dto.cohortId,
                createdBy,
            },
        });
    }

    async updateCalendarEvent(id: string, dto: UpdateCalendarEventDto) {
        return this.prisma.calendarEvent.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
            },
        });
    }

    async deleteCalendarEvent(id: string) {
        return this.prisma.calendarEvent.delete({
            where: { id },
        });
    }

    // =========================================================================
    // PROGRAM CONFIG
    // =========================================================================

    async getProgramConfig() {
        let config = await this.prisma.programConfig.findUnique({
            where: { id: 'default' },
        });

        // Create default config if it doesn't exist
        if (!config) {
            config = await this.prisma.programConfig.create({
                data: { id: 'default' },
            });
        }

        return config;
    }

    async updateProgramConfig(dto: UpdateProgramConfigDto) {
        return this.prisma.programConfig.upsert({
            where: { id: 'default' },
            update: dto,
            create: { id: 'default', ...dto },
        });
    }

    // =========================================================================
    // COHORTS
    // =========================================================================

    async listCohorts() {
        return this.prisma.cohort.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: { users: true, applicants: true },
                },
            },
        });
    }

    async getCohort(id: string) {
        return this.prisma.cohort.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true, applicants: true },
                },
            },
        });
    }

    async createCohort(dto: CreateCohortDto) {
        return this.prisma.cohort.create({
            data: {
                name: dto.name,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                capacity: dto.capacity ?? 50,
            },
        });
    }

    async updateCohort(id: string, dto: UpdateCohortDto) {
        return this.prisma.cohort.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }

    async deleteCohort(id: string) {
        // Check if cohort has users or applicants
        const cohort = await this.prisma.cohort.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true, applicants: true },
                },
            },
        });

        if (cohort?._count.users || cohort?._count.applicants) {
            throw new Error('Cannot delete cohort with assigned users or applicants');
        }

        return this.prisma.cohort.delete({
            where: { id },
        });
    }
}
