import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CohortPhase } from '@prisma/client';

/**
 * Calendar Engine Service
 *
 * Deterministic calendar engine where ONE DATE drives everything.
 * All engines read time from Command Centre only.
 *
 * Phase Boundaries:
 * - PRE_COHORT: Day -28 to 0
 * - TRAINING: Day 1-42
 * - MARKET: Day 43-69
 * - INCOME: Day 70-90
 * - EXIT: Post Day 90
 */
@Injectable()
export class CalendarEngineService {
    private readonly logger = new Logger(CalendarEngineService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Calculate all cohort milestone dates from a single start date
     */
    calculateCohortDates(startDate: Date): CohortMilestones {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        return {
            // Pre-cohort dates
            applicationOpenDate: this.addDays(start, -28),
            applicationCloseDate: this.addDays(start, -14),
            orientationDate: this.addDays(start, -1),

            // Program dates
            programStartDate: start,
            programEndDate: this.addDays(start, 90),

            // Gate dates (non-negotiable)
            day1Gate: start,
            day30Gate: this.addDays(start, 30),
            day60Gate: this.addDays(start, 60),
            day90Gate: this.addDays(start, 90),

            // Phase boundaries
            trainingEnd: this.addDays(start, 42),
            marketEnd: this.addDays(start, 69),
        };
    }

    /**
     * Get current program day for a cohort (1-90, 0 = pre-cohort, >90 = post)
     */
    getCurrentDay(startDate: Date, timezone: string = 'Africa/Lagos'): number {
        const now = new Date();
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const diffMs = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Pre-cohort returns negative or 0
        if (diffDays < 0) return diffDays;

        // Day 1 is the first day
        return diffDays + 1;
    }

    /**
     * Determine current phase based on program day
     */
    getPhaseFromDay(day: number): CohortPhase {
        if (day <= 0) return CohortPhase.PRE_COHORT;
        if (day <= 42) return CohortPhase.TRAINING;
        if (day <= 69) return CohortPhase.MARKET;
        if (day <= 90) return CohortPhase.INCOME;
        return CohortPhase.EXIT;
    }

    /**
     * Get upcoming gates within a time window
     */
    async getUpcomingGates(
        cohortId: string,
        windowDays: number = 7,
    ): Promise<UpcomingGate[]> {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });

        if (!cohort) return [];

        const milestones = this.calculateCohortDates(cohort.startDate);
        const now = new Date();
        const windowEnd = this.addDays(now, windowDays);

        const gates: UpcomingGate[] = [];

        const gateChecks = [
            { date: milestones.day1Gate, type: 'DAY_1_BASELINE', day: 1 },
            { date: milestones.day30Gate, type: 'DAY_30_SELLABLE_SKILL', day: 30 },
            { date: milestones.day60Gate, type: 'DAY_60_MARKET_CONTACT', day: 60 },
            { date: milestones.day90Gate, type: 'DAY_90_INCOME', day: 90 },
        ];

        for (const gate of gateChecks) {
            if (gate.date >= now && gate.date <= windowEnd) {
                gates.push({
                    cohortId,
                    gateType: gate.type as any,
                    scheduledDate: gate.date,
                    dayNumber: gate.day,
                    daysUntil: Math.ceil(
                        (gate.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                    ),
                });
            }
        }

        return gates;
    }

    /**
     * Update cohort's current day and phase (call daily via cron)
     */
    async updateCohortDayAndPhase(cohortId: string): Promise<void> {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
        });

        if (!cohort || !cohort.isActive) return;

        const currentDay = this.getCurrentDay(cohort.startDate, cohort.timezone);
        const currentPhase = this.getPhaseFromDay(currentDay);

        await this.prisma.cohort.update({
            where: { id: cohortId },
            data: { currentDay, currentPhase },
        });

        this.logger.log(
            `Cohort ${cohortId}: Day ${currentDay}, Phase ${currentPhase}`,
        );
    }

    /**
     * Update all active cohorts (called by scheduled task)
     */
    async updateAllCohorts(): Promise<{ updated: number }> {
        const cohorts = await this.prisma.cohort.findMany({
            where: { isActive: true },
        });

        for (const cohort of cohorts) {
            await this.updateCohortDayAndPhase(cohort.id);
        }

        return { updated: cohorts.length };
    }

    /**
     * Check if a specific gate is due today for a cohort
     */
    isGateDueToday(startDate: Date, gateDay: number): boolean {
        const currentDay = this.getCurrentDay(startDate);
        return currentDay === gateDay;
    }

    private addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

// Types
export interface CohortMilestones {
    applicationOpenDate: Date;
    applicationCloseDate: Date;
    orientationDate: Date;
    programStartDate: Date;
    programEndDate: Date;
    day1Gate: Date;
    day30Gate: Date;
    day60Gate: Date;
    day90Gate: Date;
    trainingEnd: Date;
    marketEnd: Date;
}

export interface UpcomingGate {
    cohortId: string;
    gateType: string;
    scheduledDate: Date;
    dayNumber: number;
    daysUntil: number;
}
