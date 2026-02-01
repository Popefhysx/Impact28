import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
    PsnLevel,
    PsnConstraint,
    RiskBadge,
    DetectionSeverity,
    DetectionAction,
    Applicant,
    ApplicantStatus,
} from '@prisma/client';
import { createHash } from 'crypto';

/**
 * PSN Service
 * 
 * Predicted Support Need - Internal forecasting for operational planning.
 * 
 * System Laws (from documentation):
 * - PSN is a planning forecast, not a promise
 * - Support remains request-based and behavior-gated
 * - Admission remains independent of resources
 * - Behavior always overrides prediction
 * - Detection invites requests; it never approves them
 */

// PSN calculation weights
const CONSTRAINT_WEIGHTS = {
    incomeRisk: 0.25,
    dataRisk: 0.20,
    deviceRisk: 0.20,
    timeRisk: 0.15,
    statusRisk: 0.20,
};

const READINESS_WEIGHTS = {
    actionOrientation: 0.30,
    rejectionResilience: 0.25,
    commitmentSignal: 0.25,
    consentStrength: 0.20,
};

// Current algorithm version
const PSN_VERSION = 'v1.0-deterministic';

export interface PsnOutput {
    psnLevel: PsnLevel;
    psnScore: number;
    psnConfidence: number;
    psnPrimaryConstraint: PsnConstraint;
}

export interface CohortForecastOutput {
    countHigh: number;
    countMedium: number;
    countLow: number;
    predictedDemandExpected: number;
    predictedDemandUpper: number;
    predictedDemandLower: number;
    riskBadge: RiskBadge;
}

@Injectable()
export class PsnService {
    private readonly logger = new Logger(PsnService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Calculate PSN for a single applicant
     * Called after admission decision is made
     */
    async calculatePsn(applicantId: string): Promise<PsnOutput> {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
        });

        if (!applicant) {
            throw new NotFoundException(`Applicant ${applicantId} not found`);
        }

        // Calculate constraint score (0-100)
        const constraintScore = this.calculateConstraintScore(applicant);

        // Calculate readiness score (0-100)
        const readinessScore = this.calculateReadinessScore(applicant);

        // Determine PSN level based on constraint/readiness matrix
        const psnLevel = this.determinePsnLevel(constraintScore, readinessScore);

        // Calculate overall PSN score (weighted combination)
        const psnScore = constraintScore * 0.6 + (100 - readinessScore) * 0.4;

        // Determine primary constraint
        const psnPrimaryConstraint = this.determinePrimaryConstraint(applicant);

        // Confidence based on data completeness
        const psnConfidence = this.calculateConfidence(applicant);

        const output: PsnOutput = {
            psnLevel,
            psnScore: Math.round(psnScore * 10) / 10,
            psnConfidence: Math.round(psnConfidence * 100) / 100,
            psnPrimaryConstraint,
        };

        // Store result on applicant
        await this.prisma.applicant.update({
            where: { id: applicantId },
            data: {
                psnLevel: output.psnLevel,
                psnScore: output.psnScore,
                psnConfidence: output.psnConfidence,
                psnPrimaryConstraint: output.psnPrimaryConstraint,
                psnGeneratedAt: new Date(),
            },
        });

        // Log calculation for audit
        await this.logCalculation(applicantId, applicant, output);

        this.logger.log(
            `PSN calculated for ${applicantId}: ${output.psnLevel} (score: ${output.psnScore})`,
        );

        return output;
    }

    /**
     * Generate cohort-level PSN forecast
     */
    async generateCohortForecast(cohortId: string): Promise<CohortForecastOutput> {
        // Get all admitted applicants in cohort
        const applicants = await this.prisma.applicant.findMany({
            where: {
                cohortId,
                status: {
                    in: [ApplicantStatus.ADMITTED, ApplicantStatus.CONVERTED],
                },
            },
        });

        // Ensure all have PSN calculated
        for (const applicant of applicants) {
            if (!applicant.psnLevel) {
                await this.calculatePsn(applicant.id);
            }
        }

        // Re-fetch with PSN data
        const refreshedApplicants = await this.prisma.applicant.findMany({
            where: {
                cohortId,
                status: {
                    in: [ApplicantStatus.ADMITTED, ApplicantStatus.CONVERTED],
                },
            },
        });

        // Count distribution
        const countHigh = refreshedApplicants.filter(a => a.psnLevel === PsnLevel.HIGH).length;
        const countMedium = refreshedApplicants.filter(a => a.psnLevel === PsnLevel.MEDIUM).length;
        const countLow = refreshedApplicants.filter(a => a.psnLevel === PsnLevel.LOW).length;

        // Calculate demand predictions (in USD)
        // Base allocation: $100 per participant (MSA)
        const MSA = 100;
        const highUtilization = 0.80; // 80% of budget used
        const mediumUtilization = 0.50;
        const lowUtilization = 0.20;

        const expectedDemand =
            countHigh * MSA * highUtilization +
            countMedium * MSA * mediumUtilization +
            countLow * MSA * lowUtilization;

        const upperBound = expectedDemand * 1.3; // 30% buffer
        const lowerBound = expectedDemand * 0.7;

        // Determine risk badge
        const totalBudget = refreshedApplicants.length * MSA;
        const utilizationRatio = expectedDemand / totalBudget;
        let riskBadge: RiskBadge;

        if (countHigh / refreshedApplicants.length > 0.4) {
            riskBadge = RiskBadge.RED;
        } else if (utilizationRatio > 0.6 || countHigh / refreshedApplicants.length > 0.25) {
            riskBadge = RiskBadge.AMBER;
        } else {
            riskBadge = RiskBadge.GREEN;
        }

        const forecast: CohortForecastOutput = {
            countHigh,
            countMedium,
            countLow,
            predictedDemandExpected: Math.round(expectedDemand),
            predictedDemandUpper: Math.round(upperBound),
            predictedDemandLower: Math.round(lowerBound),
            riskBadge,
        };

        // Upsert forecast record
        await this.prisma.cohortPsnForecast.upsert({
            where: { cohortId },
            create: {
                cohortId,
                ...forecast,
            },
            update: {
                ...forecast,
                generatedAt: new Date(),
            },
        });

        this.logger.log(
            `Cohort ${cohortId} PSN forecast: ${countHigh}H/${countMedium}M/${countLow}L, Risk: ${riskBadge}`,
        );

        return forecast;
    }

    /**
     * Get cohort PSN forecast
     */
    async getCohortForecast(cohortId: string) {
        const forecast = await this.prisma.cohortPsnForecast.findUnique({
            where: { cohortId },
        });

        if (!forecast) {
            // Generate if not exists
            return this.generateCohortForecast(cohortId);
        }

        return forecast;
    }

    /**
     * Create a detection trigger for proactive intervention
     */
    async createDetectionTrigger(
        participantId: string,
        signalType: string,
        severity: DetectionSeverity,
        details?: Record<string, unknown>,
    ) {
        // Determine action based on severity
        let actionTaken: DetectionAction;
        switch (severity) {
            case DetectionSeverity.HIGH:
                actionTaken = DetectionAction.ALERT;
                break;
            case DetectionSeverity.MEDIUM:
                actionTaken = DetectionAction.QUEUE;
                break;
            default:
                actionTaken = DetectionAction.PROMPT;
        }

        const trigger = await this.prisma.detectionTrigger.create({
            data: {
                participantId,
                signalType,
                severity,
                actionTaken,
                details: details ? JSON.parse(JSON.stringify(details)) : undefined,
            },
        });

        this.logger.log(
            `Detection trigger created: ${signalType} for ${participantId} (${severity} -> ${actionTaken})`,
        );

        return trigger;
    }

    /**
     * Get active (unresolved) detection triggers
     */
    async getActiveDetectionTriggers(participantId?: string) {
        return this.prisma.detectionTrigger.findMany({
            where: {
                ...(participantId && { participantId }),
                resolvedAt: null,
            },
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * Resolve a detection trigger
     */
    async resolveDetectionTrigger(triggerId: string) {
        return this.prisma.detectionTrigger.update({
            where: { id: triggerId },
            data: { resolvedAt: new Date() },
        });
    }

    // ============================================================================
    // BEHAVIORAL TRIGGER DETECTION (Triggers A-D)
    // ============================================================================

    /**
     * Run all behavioral trigger detections for all active participants
     * Can be called by a scheduled job
     */
    async runBehavioralTriggerDetection(): Promise<{
        triggersCreated: number;
        participantsChecked: number;
        triggersByType: Record<string, number>;
    }> {
        const participants = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        let triggersCreated = 0;
        const triggersByType: Record<string, number> = {};

        for (const participant of participants) {
            const triggers = await this.detectTriggersForParticipant(participant.id);
            triggersCreated += triggers.length;

            for (const t of triggers) {
                triggersByType[t.signalType] = (triggersByType[t.signalType] || 0) + 1;
            }
        }

        this.logger.log(`Behavioral trigger detection complete: ${triggersCreated} triggers for ${participants.length} participants`);

        return {
            triggersCreated,
            participantsChecked: participants.length,
            triggersByType,
        };
    }

    /**
     * Detect all behavioral triggers for a single participant
     */
    async detectTriggersForParticipant(participantId: string) {
        const triggers: Array<{ signalType: string; severity: DetectionSeverity }> = [];

        // Trigger A: Early Momentum Drop
        const momentumDrop = await this.detectMomentumDrop(participantId);
        if (momentumDrop) triggers.push(momentumDrop);

        // Trigger B: Phase Transition Blocker
        const phaseBlocker = await this.detectPhaseBlocker(participantId);
        if (phaseBlocker) triggers.push(phaseBlocker);

        // Trigger C: Repeated Near-Misses
        const nearMisses = await this.detectRepeatedNearMisses(participantId);
        if (nearMisses) triggers.push(nearMisses);

        // Create detection triggers
        const created: Awaited<ReturnType<typeof this.createDetectionTrigger>>[] = [];
        for (const t of triggers) {
            // Skip if already a pending trigger of this type
            const existing = await this.prisma.detectionTrigger.findFirst({
                where: {
                    participantId,
                    signalType: t.signalType,
                    resolvedAt: null,
                },
            });

            if (!existing) {
                const trigger = await this.createDetectionTrigger(
                    participantId,
                    t.signalType,
                    t.severity,
                );
                created.push(trigger);
            }
        }

        return created;
    }

    /**
     * Trigger A: Early Momentum Drop Detection
     * Signal: Momentum dropped >20 points in the last 7 days
     */
    private async detectMomentumDrop(participantId: string): Promise<{ signalType: string; severity: DetectionSeverity } | null> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const momentumLedger = await this.prisma.currencyLedger.findMany({
            where: {
                userId: participantId,
                currencyType: 'MOMENTUM',
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (momentumLedger.length < 2) return null;

        // Calculate net change over period
        const netChange = momentumLedger.reduce((sum, entry) => sum + entry.amount, 0);

        if (netChange <= -20) {
            return {
                signalType: 'MOMENTUM_DROP',
                severity: netChange <= -40 ? DetectionSeverity.HIGH : DetectionSeverity.MEDIUM,
            };
        }

        return null;
    }

    /**
     * Trigger B: Phase Transition Blocker Detection
     * Signal: User stuck at phase boundary for 7+ days
     */
    private async detectPhaseBlocker(participantId: string): Promise<{ signalType: string; severity: DetectionSeverity } | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: participantId },
            include: {
                missions: {
                    where: { status: 'VERIFIED' },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!user) return null;

        // Check if user has been at same level for 7+ days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastMission = user.missions[0];
        const lastActivity = lastMission?.completedAt || user.createdAt;

        if (lastActivity < sevenDaysAgo) {
            return {
                signalType: 'PHASE_BLOCKER',
                severity: DetectionSeverity.MEDIUM,
            };
        }

        return null;
    }

    /**
     * Trigger C: Repeated Near-Misses Detection
     * Signal: 3+ failed/rejected missions in the last 14 days
     */
    private async detectRepeatedNearMisses(participantId: string): Promise<{ signalType: string; severity: DetectionSeverity } | null> {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const failedMissions = await this.prisma.missionAssignment.count({
            where: {
                userId: participantId,
                status: 'FAILED',
                completedAt: { gte: fourteenDaysAgo },
            },
        });

        if (failedMissions >= 3) {
            return {
                signalType: 'REPEATED_NEAR_MISSES',
                severity: failedMissions >= 5 ? DetectionSeverity.HIGH : DetectionSeverity.MEDIUM,
            };
        }

        return null;
    }

    /**
     * Trigger D: Mentor Signal (Manual)
     * Signal: Manually flagged by operator/admin
     */
    async createMentorSignal(
        participantId: string,
        operatorId: string,
        notes?: string,
    ) {
        return this.createDetectionTrigger(
            participantId,
            'MENTOR_SIGNAL',
            DetectionSeverity.HIGH,
            { operatorId, notes },
        );
    }

    // ============================================================================
    // PRIVATE CALCULATION METHODS
    // ============================================================================

    private calculateConstraintScore(applicant: Applicant): number {
        let score = 0;

        // Income risk (0-100)
        const incomeRisk = this.getIncomeRisk(applicant.incomeRange);
        score += incomeRisk * CONSTRAINT_WEIGHTS.incomeRisk;

        // Data/Internet risk (0-100)
        const dataRisk = this.getDataRisk(applicant.hasInternet);
        score += dataRisk * CONSTRAINT_WEIGHTS.dataRisk;

        // Device risk (0-100)
        const deviceRisk = this.getDeviceRisk(applicant.primaryDevice);
        score += deviceRisk * CONSTRAINT_WEIGHTS.deviceRisk;

        // Time availability risk (0-100)
        const timeRisk = this.getTimeRisk(applicant.weeklyHours);
        score += timeRisk * CONSTRAINT_WEIGHTS.timeRisk;

        // Status risk (0-100)
        const statusRisk = this.getStatusRisk(applicant.currentStatus);
        score += statusRisk * CONSTRAINT_WEIGHTS.statusRisk;

        return Math.min(100, Math.max(0, score * 100));
    }

    private calculateReadinessScore(applicant: Applicant): number {
        let score = 0;

        // Action orientation from AI scoring
        const actionScore = (applicant.actionOrientation ?? 0.5) * 100;
        score += actionScore * READINESS_WEIGHTS.actionOrientation;

        // Rejection resilience from AI scoring
        const resilienceScore = (applicant.rejectionResilience ?? 0.5) * 100;
        score += resilienceScore * READINESS_WEIGHTS.rejectionResilience;

        // Commitment signal from AI scoring
        const commitmentScore = (applicant.commitmentSignal ?? 0.5) * 100;
        score += commitmentScore * READINESS_WEIGHTS.commitmentSignal;

        // Consent strength (number of consents given)
        const consents = [
            applicant.consentDailyAction,
            applicant.consentWeeklyCheckin,
            applicant.consentFailure,
            applicant.consentData,
        ].filter(Boolean).length;
        const consentScore = (consents / 4) * 100;
        score += consentScore * READINESS_WEIGHTS.consentStrength;

        return Math.min(100, Math.max(0, score));
    }

    private determinePsnLevel(constraintScore: number, readinessScore: number): PsnLevel {
        const highConstraint = constraintScore >= 60;
        const highReadiness = readinessScore >= 60;

        if (highConstraint && highReadiness) {
            return PsnLevel.HIGH;
        } else if (highConstraint && !highReadiness) {
            return PsnLevel.MEDIUM;
        } else if (!highConstraint && highReadiness) {
            return PsnLevel.LOW;
        } else {
            return PsnLevel.LOW;
        }
    }

    private determinePrimaryConstraint(applicant: Applicant): PsnConstraint {
        const risks = [
            { type: PsnConstraint.DATA, score: this.getDataRisk(applicant.hasInternet) },
            { type: PsnConstraint.TRANSPORT, score: this.getStatusRisk(applicant.currentStatus) * 0.5 },
            { type: PsnConstraint.TOOLS, score: this.getDeviceRisk(applicant.primaryDevice) },
        ];

        risks.sort((a, b) => b.score - a.score);
        return risks[0].score > 0.3 ? risks[0].type : PsnConstraint.OTHER;
    }

    private calculateConfidence(applicant: Applicant): number {
        // Count filled fields that contribute to PSN
        const fields = [
            applicant.incomeRange,
            applicant.hasInternet,
            applicant.primaryDevice,
            applicant.weeklyHours,
            applicant.currentStatus,
            applicant.actionOrientation,
            applicant.rejectionResilience,
            applicant.commitmentSignal,
        ];

        const filledCount = fields.filter(f => f !== null && f !== undefined).length;
        return filledCount / fields.length;
    }

    private getIncomeRisk(incomeRange: string | null): number {
        switch (incomeRange) {
            case 'ZERO': return 1.0;
            case 'LOW': return 0.7;
            case 'MEDIUM': return 0.3;
            case 'HIGH': return 0.1;
            default: return 0.5;
        }
    }

    private getDataRisk(hasInternet: string | null): number {
        switch (hasInternet) {
            case 'NO': return 1.0;
            case 'SOMETIMES': return 0.6;
            case 'YES': return 0.1;
            default: return 0.5;
        }
    }

    private getDeviceRisk(primaryDevice: string | null): number {
        switch (primaryDevice) {
            case 'SHARED_PHONE': return 0.9;
            case 'SHARED_LAPTOP': return 0.7;
            case 'PHONE': return 0.4;
            case 'LAPTOP': return 0.1;
            default: return 0.5;
        }
    }

    private getTimeRisk(weeklyHours: string | null): number {
        switch (weeklyHours) {
            case 'UNDER_5': return 0.8;
            case 'FIVE_TO_TEN': return 0.5;
            case 'TEN_TO_TWENTY': return 0.2;
            case 'TWENTY_PLUS': return 0.1;
            default: return 0.5;
        }
    }

    private getStatusRisk(currentStatus: string | null): number {
        switch (currentStatus) {
            case 'UNEMPLOYED': return 0.9;
            case 'BETWEEN_JOBS': return 0.7;
            case 'CAREGIVER': return 0.8;
            case 'STRUGGLING_BUSINESS': return 0.6;
            case 'UNDEREMPLOYED': return 0.5;
            case 'STUDENT': return 0.3;
            default: return 0.5;
        }
    }

    private async logCalculation(
        applicantId: string,
        applicant: Applicant,
        output: PsnOutput,
    ) {
        // Create input hash for reproducibility
        const inputData = {
            incomeRange: applicant.incomeRange,
            hasInternet: applicant.hasInternet,
            primaryDevice: applicant.primaryDevice,
            weeklyHours: applicant.weeklyHours,
            currentStatus: applicant.currentStatus,
            actionOrientation: applicant.actionOrientation,
            rejectionResilience: applicant.rejectionResilience,
            commitmentSignal: applicant.commitmentSignal,
            consents: {
                daily: applicant.consentDailyAction,
                weekly: applicant.consentWeeklyCheckin,
                failure: applicant.consentFailure,
                data: applicant.consentData,
            },
        };

        const inputHash = createHash('sha256')
            .update(JSON.stringify(inputData))
            .digest('hex')
            .substring(0, 16);

        await this.prisma.psnCalculationLog.create({
            data: {
                applicantId,
                version: PSN_VERSION,
                inputHash,
                output: JSON.parse(JSON.stringify(output)),
            },
        });
    }
}
