import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GateType, GateResult, ParticipantState } from '@prisma/client';
import { CalendarEngineService } from './calendar-engine.service';
import { StateAuthorityService } from './state-authority.service';

/**
 * Gate Enforcement Service
 *
 * Executes gates automatically on the specified day.
 * Gates run via cron at 00:05 on gate day.
 * Results logged immutably, no manual override during execution window.
 *
 * Gates:
 * - Day 1 Baseline: START / EXCLUDE
 * - Day 30 Sellable Skill: PASS / INTERVENE
 * - Day 60 Market Contact: PASS / ESCALATE
 * - Day 90 Income: GRADUATE / EXIT
 */
@Injectable()
export class GateEnforcementService {
    private readonly logger = new Logger(GateEnforcementService.name);

    constructor(
        private prisma: PrismaService,
        private calendarEngine: CalendarEngineService,
        private stateAuthority: StateAuthorityService,
    ) { }

    /**
     * Execute all due gates for active cohorts
     * Called by scheduled task at 00:05 daily
     */
    async executeDueGates(): Promise<GateExecutionSummary> {
        const cohorts = await this.prisma.cohort.findMany({
            where: { isActive: true },
            include: { users: true },
        });

        const summary: GateExecutionSummary = {
            cohortsProcessed: 0,
            gatesExecuted: 0,
            results: [],
        };

        for (const cohort of cohorts) {
            const currentDay = this.calendarEngine.getCurrentDay(
                cohort.startDate,
                cohort.timezone,
            );

            // Check each gate
            if (currentDay === 1) {
                const result = await this.executeGateForCohort(
                    cohort.id,
                    GateType.DAY_1_BASELINE,
                    currentDay,
                );
                summary.results.push(result);
                summary.gatesExecuted++;
            }

            if (currentDay === 30) {
                const result = await this.executeGateForCohort(
                    cohort.id,
                    GateType.DAY_30_SELLABLE_SKILL,
                    currentDay,
                );
                summary.results.push(result);
                summary.gatesExecuted++;
            }

            if (currentDay === 60) {
                const result = await this.executeGateForCohort(
                    cohort.id,
                    GateType.DAY_60_MARKET_CONTACT,
                    currentDay,
                );
                summary.results.push(result);
                summary.gatesExecuted++;
            }

            if (currentDay === 90) {
                const result = await this.executeGateForCohort(
                    cohort.id,
                    GateType.DAY_90_INCOME,
                    currentDay,
                );
                summary.results.push(result);
                summary.gatesExecuted++;
            }

            summary.cohortsProcessed++;
        }

        this.logger.log(
            `Gate execution complete: ${summary.gatesExecuted} gates across ${summary.cohortsProcessed} cohorts`,
        );

        return summary;
    }

    /**
     * Execute a specific gate for all participants in a cohort
     */
    async executeGateForCohort(
        cohortId: string,
        gateType: GateType,
        dayNumber: number,
    ): Promise<CohortGateResult> {
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
            include: {
                users: {
                    where: {
                        participantState: {
                            in: [ParticipantState.ACTIVE, ParticipantState.AT_RISK],
                        },
                    },
                },
            },
        });

        if (!cohort) {
            return { cohortId, gateType, passed: 0, failed: 0, intervention: 0 };
        }

        const result: CohortGateResult = {
            cohortId,
            gateType,
            passed: 0,
            failed: 0,
            intervention: 0,
        };

        for (const user of cohort.users) {
            // Check idempotency - skip if already evaluated
            const existing = await this.prisma.gateEvaluation.findFirst({
                where: { userId: user.id, cohortId, gateType },
            });

            if (existing) {
                this.logger.debug(`Gate ${gateType} already evaluated for ${user.id}`);
                continue;
            }

            const evaluation = await this.evaluateParticipantGate(
                user.id,
                cohortId,
                gateType,
                dayNumber,
            );

            if (evaluation.result === GateResult.PASS) result.passed++;
            else if (evaluation.result === GateResult.FAIL) result.failed++;
            else if (evaluation.result === GateResult.INTERVENTION_REQUIRED)
                result.intervention++;
        }

        return result;
    }

    /**
     * Evaluate a single participant for a gate
     */
    async evaluateParticipantGate(
        userId: string,
        cohortId: string,
        gateType: GateType,
        dayNumber: number,
    ): Promise<{ result: GateResult; evaluationData: any }> {
        let result: GateResult;
        let evaluationData: any;

        switch (gateType) {
            case GateType.DAY_1_BASELINE:
                ({ result, evaluationData } = await this.evaluateDay1(userId));
                break;
            case GateType.DAY_30_SELLABLE_SKILL:
                ({ result, evaluationData } = await this.evaluateDay30(userId));
                break;
            case GateType.DAY_60_MARKET_CONTACT:
                ({ result, evaluationData } = await this.evaluateDay60(userId));
                break;
            case GateType.DAY_90_INCOME:
                ({ result, evaluationData } = await this.evaluateDay90(userId));
                break;
            default:
                result = GateResult.PENDING;
                evaluationData = {};
        }

        // Record evaluation (immutable)
        const gateEvaluation = await this.prisma.gateEvaluation.create({
            data: {
                cohortId,
                userId,
                gateType,
                dayNumber,
                result,
                evaluationData,
            },
        });

        // Handle state transitions based on result
        await this.handleGateResult(userId, gateType, result, gateEvaluation.id);

        return { result, evaluationData };
    }

    /**
     * Day 1 Baseline: Check orientation attendance and consent
     */
    private async evaluateDay1(
        userId: string,
    ): Promise<{ result: GateResult; evaluationData: any }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { applicant: true },
        });

        const evaluationData = {
            hasApplicant: !!user?.applicant,
            consentDailyAction: user?.applicant?.consentDailyAction ?? false,
            consentWeeklyCheckin: user?.applicant?.consentWeeklyCheckin ?? false,
            consentFailure: user?.applicant?.consentFailure ?? false,
            consentData: user?.applicant?.consentData ?? false,
        };

        // Pass if all consents are true
        const allConsents =
            evaluationData.consentDailyAction &&
            evaluationData.consentWeeklyCheckin &&
            evaluationData.consentFailure &&
            evaluationData.consentData;

        return {
            result: allConsents ? GateResult.PASS : GateResult.INTERVENTION_REQUIRED,
            evaluationData,
        };
    }

    /**
     * Day 30 Sellable Skill: Check mission completion and skill scores
     */
    private async evaluateDay30(
        userId: string,
    ): Promise<{ result: GateResult; evaluationData: any }> {
        // Get mission completion stats
        const missions = await this.prisma.missionAssignment.findMany({
            where: { userId },
        });

        const verified = missions.filter((m) => m.status === 'VERIFIED').length;
        const total = missions.length;

        // Get skill triad scores
        const triadScore = await this.prisma.skillTriadScore.findUnique({
            where: { userId },
        });

        // Get momentum
        const momentum = await this.prisma.currencyLedger.aggregate({
            where: { userId, currencyType: 'MOMENTUM' },
            _sum: { amount: true },
        });

        const evaluationData = {
            missionsVerified: verified,
            missionsTotal: total,
            completionRate: total > 0 ? verified / total : 0,
            technicalScore: triadScore?.technical ?? 0,
            softScore: triadScore?.soft ?? 0,
            commercialScore: triadScore?.commercial ?? 0,
            momentum: momentum._sum.amount ?? 0,
        };

        // Pass if: >50% missions complete AND technical score >= 30
        const passes =
            evaluationData.completionRate >= 0.5 &&
            evaluationData.technicalScore >= 30;

        return {
            result: passes ? GateResult.PASS : GateResult.INTERVENTION_REQUIRED,
            evaluationData,
        };
    }

    /**
     * Day 60 Market Contact: Check outreach evidence
     */
    private async evaluateDay60(
        userId: string,
    ): Promise<{ result: GateResult; evaluationData: any }> {
        // Check for commercial missions (outreach evidence)
        const commercialMissions = await this.prisma.missionAssignment.findMany({
            where: {
                userId,
                mission: { skillDomain: 'COMMERCIAL' },
                status: 'VERIFIED',
            },
        });

        // Check behavior logs for outreach
        const outreachLogs = await this.prisma.behaviorLog.findMany({
            where: {
                userId,
                eventType: { in: ['OUTREACH', 'CLIENT_CONTACT', 'MARKET_ACTIVITY'] },
            },
        });

        const evaluationData = {
            commercialMissionsCompleted: commercialMissions.length,
            outreachLogCount: outreachLogs.length,
            hasMarketEvidence: commercialMissions.length >= 3 || outreachLogs.length >= 5,
        };

        return {
            result: evaluationData.hasMarketEvidence
                ? GateResult.PASS
                : GateResult.INTERVENTION_REQUIRED,
            evaluationData,
        };
    }

    /**
     * Day 90 Income: Check for verified income proof
     */
    private async evaluateDay90(
        userId: string,
    ): Promise<{ result: GateResult; evaluationData: any }> {
        const incomeRecords = await this.prisma.incomeRecord.findMany({
            where: { userId, status: 'VERIFIED' },
        });

        const totalIncome = incomeRecords.reduce(
            (sum, r) => sum + Number(r.amount),
            0,
        );

        // Check journal submissions
        const journalMissions = await this.prisma.missionAssignment.findMany({
            where: {
                userId,
                mission: { title: { contains: 'Journal' } },
                status: 'VERIFIED',
            },
        });

        // Check for unresolved gate failures
        const failedGates = await this.prisma.gateEvaluation.findMany({
            where: { userId, result: GateResult.FAIL },
        });

        const evaluationData = {
            verifiedIncomeRecords: incomeRecords.length,
            totalVerifiedIncome: totalIncome,
            hasVerifiedIncome: incomeRecords.length > 0 && totalIncome > 0,
            journalCount: journalMissions.length,
            unresolvedGateFailures: failedGates.length,
        };

        // Graduate if: has verified income AND no unresolved failures
        const graduates =
            evaluationData.hasVerifiedIncome &&
            evaluationData.unresolvedGateFailures === 0;

        return {
            result: graduates ? GateResult.PASS : GateResult.FAIL,
            evaluationData,
        };
    }

    /**
     * Handle state transitions based on gate result
     */
    private async handleGateResult(
        userId: string,
        gateType: GateType,
        result: GateResult,
        gateEvaluationId: string,
    ): Promise<void> {
        if (result === GateResult.PASS) {
            // Day 90 pass = graduation
            if (gateType === GateType.DAY_90_INCOME) {
                await this.stateAuthority.transitionState(
                    userId,
                    ParticipantState.GRADUATED,
                    `Passed ${gateType}`,
                    'SYSTEM',
                    gateEvaluationId,
                );
            }
            return;
        }

        if (result === GateResult.FAIL) {
            // Day 90 fail = exit
            if (gateType === GateType.DAY_90_INCOME) {
                await this.stateAuthority.transitionState(
                    userId,
                    ParticipantState.EXITED,
                    `Failed ${gateType} - No verified income`,
                    'SYSTEM',
                    gateEvaluationId,
                );
            }
            return;
        }

        if (result === GateResult.INTERVENTION_REQUIRED) {
            // Mark as at-risk for intervention
            await this.stateAuthority.transitionState(
                userId,
                ParticipantState.AT_RISK,
                `${gateType} requires intervention`,
                'SYSTEM',
                gateEvaluationId,
            );
        }
    }

    /**
     * Get gate results for a cohort
     */
    async getCohortGateResults(cohortId: string, gateType?: GateType) {
        return this.prisma.gateEvaluation.findMany({
            where: {
                cohortId,
                ...(gateType ? { gateType } : {}),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { executedAt: 'desc' },
        });
    }
}

// Types
export interface GateExecutionSummary {
    cohortsProcessed: number;
    gatesExecuted: number;
    results: CohortGateResult[];
}

export interface CohortGateResult {
    cohortId: string;
    gateType: GateType;
    passed: number;
    failed: number;
    intervention: number;
}
