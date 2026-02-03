import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { ApplicantStatus, RejectionReason, Applicant } from '@prisma/client';
import { AdmissionService } from '../admission';

/**
 * AI Scoring Service
 *
 * Implements the Impact OS Diagnostic Probe system:
 * - Technical Probe: Tests Action Orientation
 * - Commercial Probe: Tests Market Awareness
 * - Soft Probe: Tests Rejection Resilience
 * - Commitment Probe: Tests Commitment Signal
 *
 * Each probe is scored 0-1, combined into a readinessScore.
 * Uses Anthropic Claude for analysis, with fallback to rule-based scoring.
 */

interface ProbeScores {
  actionOrientation: number;
  marketAwareness: number;
  rejectionResilience: number;
  commitmentSignal: number;
}

interface ScoringResult {
  readinessScore: number;
  scores: ProbeScores;
  riskFlags: string[];
  recommendation: 'ADMIT' | 'CONDITIONAL' | 'WAITLIST' | 'REJECT';
  diagnosticReport: object;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly anthropicApiKey: string | undefined;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(forwardRef(() => AdmissionService))
    private admissionService: AdmissionService,
  ) {
    this.anthropicApiKey = this.config.get<string>('ANTHROPIC_API_KEY');
  }

  /**
   * Score an applicant after submission
   */
  async scoreApplicant(applicantId: string): Promise<ScoringResult> {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      throw new Error(`Applicant ${applicantId} not found`);
    }

    // Update status to SCORING
    await this.prisma.applicant.update({
      where: { id: applicantId },
      data: { status: ApplicantStatus.SCORING },
    });

    try {
      // Try AI scoring first, fallback to rule-based
      const result = this.anthropicApiKey
        ? await this.scoreWithAI(applicant)
        : this.scoreWithRules(applicant);

      // Determine final status and apply
      const finalStatus = this.mapRecommendationToStatus(result.recommendation);
      const rejectionReason =
        result.recommendation === 'REJECT'
          ? this.determineRejectionReason(result)
          : null;

      await this.prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: finalStatus,
          readinessScore: result.readinessScore,
          actionOrientation: result.scores.actionOrientation,
          marketAwareness: result.scores.marketAwareness,
          rejectionResilience: result.scores.rejectionResilience,
          commitmentSignal: result.scores.commitmentSignal,
          riskFlags: result.riskFlags,
          aiRecommendation: result.recommendation,
          diagnosticReport: result.diagnosticReport,
          rejectionReason: rejectionReason,
          reviewedAt: new Date(),
        },
      });

      this.logger.log(
        `Scored applicant ${applicantId}: ${result.recommendation} (${result.readinessScore.toFixed(2)})`,
      );

      // Trigger admission processing (emails, conditional tasks) async
      this.admissionService.processAdmission(applicantId).catch((error) => {
        this.logger.error(
          `Admission processing failed for ${applicantId}: ${error.message}`,
        );
      });

      return result;
    } catch (error) {
      // On error, fall back to PENDING for manual review
      await this.prisma.applicant.update({
        where: { id: applicantId },
        data: { status: ApplicantStatus.PENDING },
      });
      throw error;
    }
  }

  /**
   * Rule-based scoring (fallback when no OpenAI key)
   */
  private scoreWithRules(applicant: Applicant): ScoringResult {
    const riskFlags: string[] = [];

    // === ACTION ORIENTATION (Technical Probe) ===
    let actionOrientation = 0.5;
    const technicalProbe = applicant.technicalProbe?.toLowerCase() || '';

    // High action signals
    if (
      technicalProbe.includes('practice') ||
      technicalProbe.includes('try') ||
      technicalProbe.includes('test') ||
      technicalProbe.includes('apply')
    ) {
      actionOrientation = 0.8;
    }
    // Medium signals
    else if (
      technicalProbe.includes('learn more') ||
      technicalProbe.includes('watch')
    ) {
      actionOrientation = 0.5;
    }
    // Low signals (passive)
    else if (
      technicalProbe.includes('read about') ||
      technicalProbe.length < 20
    ) {
      actionOrientation = 0.3;
      riskFlags.push('LOW_ACTION_ORIENTATION');
    }

    // === MARKET AWARENESS (Commercial Probe) ===
    let marketAwareness = 0.5;
    const commercialProbe = applicant.commercialProbe?.toLowerCase() || '';

    if (
      commercialProbe.includes('price') ||
      commercialProbe.includes('value') ||
      commercialProbe.includes('market') ||
      commercialProbe.includes('client')
    ) {
      marketAwareness = 0.8;
    } else if (
      commercialProbe.includes('money') ||
      commercialProbe.includes('pay')
    ) {
      marketAwareness = 0.6;
    } else if (commercialProbe.length < 20) {
      marketAwareness = 0.3;
      riskFlags.push('LOW_MARKET_AWARENESS');
    }

    // === REJECTION RESILIENCE (Soft Probe) ===
    let rejectionResilience = 0.5;
    const exposureProbe = applicant.exposureProbe?.toLowerCase() || '';

    // Resilient signals
    if (
      exposureProbe.includes('learn') ||
      exposureProbe.includes('improve') ||
      exposureProbe.includes('feedback') ||
      exposureProbe.includes('try again')
    ) {
      rejectionResilience = 0.8;
    }
    // Avoidant signals
    else if (
      exposureProbe.includes('give up') ||
      exposureProbe.includes('quit') ||
      exposureProbe.includes('painful')
    ) {
      rejectionResilience = 0.3;
      riskFlags.push('LOW_REJECTION_RESILIENCE');
    }

    // === COMMITMENT SIGNAL (Commitment Probe) ===
    let commitmentSignal = 0.5;
    const commitmentProbe = applicant.commitmentProbe?.toLowerCase() || '';

    // Strong commitment signals
    if (
      commitmentProbe.includes('family') ||
      commitmentProbe.includes('future') ||
      commitmentProbe.includes('goal') ||
      commitmentProbe.includes('responsibility')
    ) {
      commitmentSignal = 0.9;
    }
    // Clear purpose signals
    else if (
      commitmentProbe.includes('need') ||
      commitmentProbe.includes('want') ||
      commitmentProbe.includes('change')
    ) {
      commitmentSignal = 0.7;
    }
    // Weak signals
    else if (commitmentProbe.length < 30) {
      commitmentSignal = 0.4;
      riskFlags.push('WEAK_COMMITMENT_SIGNAL');
    }

    // === RESOURCE CHECKS (Soft Gates) ===
    if (applicant.hasInternet === 'NO') {
      riskFlags.push('NO_INTERNET_ACCESS');
    }
    if (applicant.weeklyHours === 'UNDER_5') {
      riskFlags.push('LIMITED_TIME_COMMITMENT');
    }
    if (applicant.primaryDevice === 'SHARED_PHONE') {
      riskFlags.push('SHARED_DEVICE');
    }

    // === CALCULATE READINESS SCORE ===
    const weights = {
      actionOrientation: 0.3,
      marketAwareness: 0.25,
      rejectionResilience: 0.25,
      commitmentSignal: 0.2,
    };

    const readinessScore =
      actionOrientation * weights.actionOrientation +
      marketAwareness * weights.marketAwareness +
      rejectionResilience * weights.rejectionResilience +
      commitmentSignal * weights.commitmentSignal;

    // === DETERMINE RECOMMENDATION ===
    let recommendation: ScoringResult['recommendation'];

    if (readinessScore >= 0.7 && riskFlags.length === 0) {
      recommendation = 'ADMIT';
    } else if (readinessScore >= 0.55 || riskFlags.length <= 2) {
      recommendation = 'CONDITIONAL';
    } else if (readinessScore >= 0.4) {
      recommendation = 'WAITLIST';
    } else {
      recommendation = 'REJECT';
    }

    return {
      readinessScore,
      scores: {
        actionOrientation,
        marketAwareness,
        rejectionResilience,
        commitmentSignal,
      },
      riskFlags,
      recommendation,
      diagnosticReport: {
        method: 'RULE_BASED',
        timestamp: new Date().toISOString(),
        probeAnalysis: {
          technical: {
            text: applicant.technicalProbe,
            score: actionOrientation,
          },
          commercial: {
            text: applicant.commercialProbe,
            score: marketAwareness,
          },
          exposure: {
            text: applicant.exposureProbe,
            score: rejectionResilience,
          },
          commitment: {
            text: applicant.commitmentProbe,
            score: commitmentSignal,
          },
        },
        resourceFlags: {
          internet: applicant.hasInternet,
          hours: applicant.weeklyHours,
          device: applicant.primaryDevice,
        },
      },
    };
  }

  /**
   * AI-powered scoring using Anthropic Claude 3.5 Sonnet
   */
  private async scoreWithAI(applicant: Applicant): Promise<ScoringResult> {
    const prompt = this.buildScoringPrompt(applicant);
    const systemPrompt = `You are an AI evaluator for a skills training program. You assess applicant readiness based on their responses to diagnostic probes. Be encouraging but honest. Score each dimension 0-1.

Return JSON only:
{
  "actionOrientation": 0.0-1.0,
  "marketAwareness": 0.0-1.0,
  "rejectionResilience": 0.0-1.0,
  "commitmentSignal": 0.0-1.0,
  "riskFlags": ["FLAG1", "FLAG2"],
  "reasoning": "Brief explanation"
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResult = JSON.parse(data.content[0].text);

      const readinessScore =
        aiResult.actionOrientation * 0.3 +
        aiResult.marketAwareness * 0.25 +
        aiResult.rejectionResilience * 0.25 +
        aiResult.commitmentSignal * 0.2;

      let recommendation: ScoringResult['recommendation'];
      if (readinessScore >= 0.7 && aiResult.riskFlags.length === 0) {
        recommendation = 'ADMIT';
      } else if (readinessScore >= 0.55) {
        recommendation = 'CONDITIONAL';
      } else if (readinessScore >= 0.4) {
        recommendation = 'WAITLIST';
      } else {
        recommendation = 'REJECT';
      }

      return {
        readinessScore,
        scores: {
          actionOrientation: aiResult.actionOrientation,
          marketAwareness: aiResult.marketAwareness,
          rejectionResilience: aiResult.rejectionResilience,
          commitmentSignal: aiResult.commitmentSignal,
        },
        riskFlags: aiResult.riskFlags,
        recommendation,
        diagnosticReport: {
          method: 'AI_CLAUDE_SONNET',
          timestamp: new Date().toISOString(),
          aiReasoning: aiResult.reasoning,
          probeAnalysis: {
            technical: {
              text: applicant.technicalProbe,
              score: aiResult.actionOrientation,
            },
            commercial: {
              text: applicant.commercialProbe,
              score: aiResult.marketAwareness,
            },
            exposure: {
              text: applicant.exposureProbe,
              score: aiResult.rejectionResilience,
            },
            commitment: {
              text: applicant.commitmentProbe,
              score: aiResult.commitmentSignal,
            },
          },
        },
      };
    } catch (error) {
      this.logger.warn(`AI scoring failed, falling back to rules: ${error}`);
      return this.scoreWithRules(applicant);
    }
  }

  private buildScoringPrompt(applicant: Applicant): string {
    return `Evaluate this applicant for a skills training program:

PROFILE:
- Age: ${applicant.age}
- Current Status: ${applicant.currentStatus}
- Education: ${applicant.educationLevel}
- Challenge: "${applicant.biggestChallenge}"
- Skill Track: ${applicant.skillTrack}
- Weekly Hours Available: ${applicant.weeklyHours}
- Device: ${applicant.primaryDevice}
- Internet Access: ${applicant.hasInternet}

DIAGNOSTIC PROBES:

1. TECHNICAL PROBE (Action Orientation):
"You've learned a new skill. What's the FIRST thing you'd do to test it?"
Answer: "${applicant.technicalProbe}"

2. COMMERCIAL PROBE (Market Awareness):
"How do you think about pricing your work?"
Answer: "${applicant.commercialProbe}"

3. SOFT PROBE (Rejection Resilience):
"How do you handle rejection when trying to get work?"
Answer: "${applicant.exposureProbe}"

4. COMMITMENT PROBE (Why Signal):
"What keeps you going when things get hard?"
Answer: "${applicant.commitmentProbe}"

Evaluate and return JSON scores.`;
  }

  private mapRecommendationToStatus(
    recommendation: ScoringResult['recommendation'],
  ): ApplicantStatus {
    switch (recommendation) {
      case 'ADMIT':
        return ApplicantStatus.ADMITTED;
      case 'CONDITIONAL':
        return ApplicantStatus.CONDITIONAL;
      case 'WAITLIST':
        return ApplicantStatus.WAITLIST;
      case 'REJECT':
        return ApplicantStatus.REJECTED;
    }
  }

  private determineRejectionReason(result: ScoringResult): RejectionReason {
    if (result.riskFlags.includes('NO_INTERNET_ACCESS')) {
      return RejectionReason.NO_INTERNET;
    }
    if (
      result.riskFlags.includes('SHARED_DEVICE') &&
      result.readinessScore < 0.4
    ) {
      return RejectionReason.NO_DEVICE;
    }
    return RejectionReason.LOW_READINESS;
  }
}
