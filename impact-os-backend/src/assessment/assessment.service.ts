import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Applicant, OfferType, SkillDomain } from '@prisma/client';

/**
 * Assessment Service
 * 
 * Calculates Skill Triad scores from intake probes and determines
 * offer type, stipend eligibility, and KPI targets.
 */

// Qualifying statuses for stipend
const STIPEND_QUALIFYING_STATUSES = ['UNEMPLOYED', 'UNDEREMPLOYED', 'CAREGIVER', 'STUDENT'];

// KPI targets by offer type
const KPI_TARGETS = {
    FULL_SUPPORT: {
        weeklyXp: 100,
        weeklyArena: 20,
        incomeTarget: 10000, // NGN
        graduationDay: 90,
    },
    SKILLS_ONLY: {
        weeklyXp: 150,
        weeklyArena: 30,
        incomeTarget: null, // Optional
        graduationDay: 90,
    },
    ACCELERATOR: {
        weeklyXp: 50,
        weeklyArena: 50,
        incomeTarget: 10000, // First client
        graduationDay: 60,
    },
    CATALYST_TRACK: {
        weeklyXp: null, // Optional
        weeklyArena: 50,
        incomeTarget: 30000, // 3+ clients
        graduationDay: 45,
    },
};

export interface SkillTriad {
    technical: number;
    soft: number;
    commercial: number;
}

export interface AssessmentResult {
    triad: SkillTriad;
    offerType: OfferType;
    receivesStipend: boolean;
    primaryFocus: SkillDomain;
    kpiTargets: typeof KPI_TARGETS[keyof typeof KPI_TARGETS];
}

@Injectable()
export class AssessmentService {
    private readonly logger = new Logger(AssessmentService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Run full assessment on an applicant
     * Calculates triad, determines offer, and saves results
     */
    async assessApplicant(applicantId: string): Promise<AssessmentResult> {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
        });

        if (!applicant) {
            throw new Error(`Applicant ${applicantId} not found`);
        }

        // Step 1: Calculate Skill Triad
        const triad = await this.calculateSkillTriad(applicant);

        // Step 2: Determine offer type
        const offerType = this.determineOfferType(applicant, triad);

        // Step 3: Check stipend eligibility
        const receivesStipend = this.determineStipendEligibility(applicant, offerType);

        // Step 4: Determine primary focus (lowest axis)
        const primaryFocus = this.determinePrimaryFocus(triad);

        // Step 5: Assign KPI targets
        const kpiTargets = KPI_TARGETS[offerType];

        // Save to database
        await this.prisma.applicant.update({
            where: { id: applicantId },
            data: {
                triadTechnical: triad.technical,
                triadSoft: triad.soft,
                triadCommercial: triad.commercial,
                offerType,
                receivesStipend,
                primaryFocus,
                kpiTargets,
            },
        });

        this.logger.log(`Assessed applicant ${applicantId}: ${offerType}, stipend=${receivesStipend}`);

        return { triad, offerType, receivesStipend, primaryFocus, kpiTargets };
    }

    /**
     * Calculate Skill Triad from applicant data
     */
    async calculateSkillTriad(applicant: Applicant): Promise<SkillTriad> {
        // Base scores from existing AI diagnosis
        let technical = 0;
        let soft = 0;
        let commercial = 0;

        // Use existing AI scores if available
        if (applicant.readinessScore) {
            technical += applicant.readinessScore * 20;
        }
        if (applicant.actionOrientation) {
            soft += applicant.actionOrientation * 25;
        }
        if (applicant.marketAwareness) {
            commercial += applicant.marketAwareness * 25;
        }
        if (applicant.commitmentSignal) {
            soft += applicant.commitmentSignal * 15;
        }

        // Bonus from behavioral indicators
        if (applicant.triedLearningSkill) {
            technical += 15;
        }
        if (applicant.triedOnlineEarning) {
            commercial += 20;
        }

        // Income indicates commercial experience
        if (applicant.currentMonthlyIncome && applicant.currentMonthlyIncome > 0) {
            commercial += 25;
        }

        // Probe quality scoring (simplified - could be AI-powered)
        if (applicant.technicalProbe && applicant.technicalProbe.length > 100) {
            technical += 10;
        }
        if (applicant.commercialProbe && applicant.commercialProbe.length > 100) {
            commercial += 10;
        }
        if (applicant.commitmentProbe && applicant.commitmentProbe.length > 100) {
            soft += 10;
        }
        if (applicant.exposureProbe && applicant.exposureProbe.length > 100) {
            soft += 5;
            commercial += 5;
        }

        // Normalize to 0-100
        return {
            technical: Math.min(100, Math.max(0, technical)),
            soft: Math.min(100, Math.max(0, soft)),
            commercial: Math.min(100, Math.max(0, commercial)),
        };
    }

    /**
     * Determine offer type based on income and skill level
     */
    determineOfferType(applicant: Applicant, triad: SkillTriad): OfferType {
        const hasIncome = (applicant.currentMonthlyIncome ?? 0) > 0;
        const technical = triad.technical;

        if (!hasIncome) {
            // No income path
            if (technical < 70) {
                return OfferType.FULL_SUPPORT;
            }
            return OfferType.ACCELERATOR;
        } else {
            // Has income path
            if (technical < 40) {
                return OfferType.SKILLS_ONLY;
            } else if (technical < 70) {
                return OfferType.ACCELERATOR;
            }
            return OfferType.CATALYST_TRACK;
        }
    }

    /**
     * Determine if applicant qualifies for monetary stipend
     */
    determineStipendEligibility(applicant: Applicant, offerType: OfferType): boolean {
        // Only FULL_SUPPORT receives stipend
        if (offerType !== OfferType.FULL_SUPPORT) {
            return false;
        }

        // Must have no income
        if ((applicant.currentMonthlyIncome ?? 0) > 0) {
            return false;
        }

        // Must have qualifying status
        if (!applicant.currentStatus ||
            !STIPEND_QUALIFYING_STATUSES.includes(applicant.currentStatus)) {
            return false;
        }

        return true;
    }

    /**
     * Determine primary focus area (lowest triad axis)
     */
    determinePrimaryFocus(triad: SkillTriad): SkillDomain {
        const { technical, soft, commercial } = triad;
        const min = Math.min(technical, soft, commercial);

        if (min === commercial) return SkillDomain.COMMERCIAL;
        if (min === technical) return SkillDomain.TECHNICAL;
        return SkillDomain.SOFT;
    }

    /**
     * Get assessment summary for offer email
     */
    async getAssessmentSummary(applicantId: string) {
        const applicant = await this.prisma.applicant.findUnique({
            where: { id: applicantId },
            select: {
                firstName: true,
                triadTechnical: true,
                triadSoft: true,
                triadCommercial: true,
                offerType: true,
                receivesStipend: true,
                primaryFocus: true,
                kpiTargets: true,
                skillTrack: true,
            },
        });

        if (!applicant) {
            throw new Error(`Applicant ${applicantId} not found`);
        }

        // Find highest and lowest axis
        const triad = {
            technical: applicant.triadTechnical ?? 0,
            soft: applicant.triadSoft ?? 0,
            commercial: applicant.triadCommercial ?? 0,
        };

        const axes = Object.entries(triad);
        axes.sort((a, b) => b[1] - a[1]);

        return {
            firstName: applicant.firstName,
            triad,
            highestAxis: axes[0][0],
            highestScore: Math.round(axes[0][1]),
            lowestAxis: axes[2][0],
            lowestScore: Math.round(axes[2][1]),
            offerType: applicant.offerType,
            receivesStipend: applicant.receivesStipend,
            primaryFocus: applicant.primaryFocus,
            kpiTargets: applicant.kpiTargets,
            skillTrack: applicant.skillTrack,
        };
    }
}
