import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { ApplicantStatus, RejectionReason, Applicant } from '@prisma/client';
import { AdmissionService } from '../admission';
import { AssessmentService } from '../assessment';

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
  recommendation: 'ADMIT' | 'WAITLIST' | 'REJECT';
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
    @Inject(forwardRef(() => AssessmentService))
    private assessmentService: AssessmentService,
  ) {
    this.anthropicApiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    // Log API key status on startup
    if (this.anthropicApiKey) {
      this.logger.log('AI scoring enabled (ANTHROPIC_API_KEY configured)');
    } else {
      this.logger.warn('AI scoring disabled - ANTHROPIC_API_KEY not configured, using rule-based scoring');
    }
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

      // Store scores and set status to SCORED — admin makes the final admission decision
      const rejectionReason =
        result.recommendation === 'REJECT'
          ? this.determineRejectionReason(result)
          : null;

      await this.prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: ApplicantStatus.SCORED,
          readinessScore: result.readinessScore,
          actionOrientation: result.scores.actionOrientation,
          marketAwareness: result.scores.marketAwareness,
          rejectionResilience: result.scores.rejectionResilience,
          commitmentSignal: result.scores.commitmentSignal,
          riskFlags: result.riskFlags,
          aiRecommendation: result.recommendation,
          diagnosticReport: result.diagnosticReport,
          rejectionReason: rejectionReason,
        },
      });

      this.logger.log(
        `Scored applicant ${applicantId}: AI recommends ${result.recommendation} (${result.readinessScore.toFixed(2)}) — awaiting admin decision`,
      );

      // Run assessment to calculate Skill Triad, offer type, and eligibility
      try {
        await this.assessmentService.assessApplicant(applicantId);
        this.logger.log(`Assessed applicant ${applicantId}: Skill Triad and offer calculated`);
      } catch (assessError) {
        this.logger.error(`Assessment failed for ${applicantId}: ${assessError}`);
        // Admin can still review manually even without assessment data
      }

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
    } else if (readinessScore >= 0.4) {
      recommendation = 'WAITLIST';
    } else {
      recommendation = 'REJECT';
    }

    // Generate explanation for the recommendation
    const explanation = this.generateExplanation(
      recommendation,
      readinessScore,
      { actionOrientation, marketAwareness, rejectionResilience, commitmentSignal },
      riskFlags,
    );

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
        explanation,
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
   * Generate a human-readable explanation for the recommendation
   */
  private generateExplanation(
    recommendation: string,
    readinessScore: number,
    scores: ProbeScores,
    riskFlags: string[],
  ): string {
    const scorePercent = Math.round(readinessScore * 100);
    const parts: string[] = [];

    // Main recommendation reason
    switch (recommendation) {
      case 'ADMIT':
        parts.push(`Strong readiness score of ${scorePercent}% with no risk flags.`);
        break;
      case 'WAITLIST':
        if (riskFlags.length > 0) {
          parts.push(`Moderate readiness (${scorePercent}%) with flagged concerns.`);
        } else {
          parts.push(`Readiness score of ${scorePercent}% is below admission threshold.`);
        }
        break;
      case 'REJECT':
        parts.push(`Low readiness score of ${scorePercent}% indicates significant gaps.`);
        break;
    }

    // Highlight lowest score
    const lowestScore = Object.entries(scores).reduce((min, [key, val]) =>
      val < min.val ? { key, val } : min,
      { key: '', val: 1 },
    );
    const scoreLabels: Record<string, string> = {
      actionOrientation: 'action orientation',
      marketAwareness: 'market awareness',
      rejectionResilience: 'rejection resilience',
      commitmentSignal: 'commitment signal',
    };
    if (lowestScore.val < 0.5) {
      parts.push(`Lowest area: ${scoreLabels[lowestScore.key]} (${Math.round(lowestScore.val * 100)}%).`);
    }

    // Risk flags summary
    if (riskFlags.length > 0) {
      const flagDescriptions: Record<string, string> = {
        LOW_ACTION_ORIENTATION: 'passive approach to skill application',
        LOW_MARKET_AWARENESS: 'limited commercial understanding',
        LOW_REJECTION_RESILIENCE: 'concerns about handling setbacks',
        WEAK_COMMITMENT_SIGNAL: 'unclear commitment to program',
        NO_INTERNET_ACCESS: 'no reliable internet access',
        LIMITED_TIME_COMMITMENT: 'limited weekly hours available',
        SHARED_DEVICE: 'relies on shared device',
      };
      const flagTexts = riskFlags
        .map(f => flagDescriptions[f] || f.toLowerCase().replace(/_/g, ' '))
        .slice(0, 2);
      parts.push(`Concerns: ${flagTexts.join(', ')}.`);
    }

    return parts.join(' ');
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
        const errorBody = await response.text();
        this.logger.error(`Claude API returned ${response.status}: ${errorBody}`);
        throw new Error(`Claude API error: ${response.status} - ${errorBody}`);
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
      // Detailed error logging for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`AI scoring failed for applicant ${applicant.id}, falling back to rules.`);
      this.logger.error(`AI Error: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`AI Stack: ${errorStack}`);
      }
      // Log API key state for debugging (first/last 4 chars only)
      if (this.anthropicApiKey) {
        const keyPreview = `${this.anthropicApiKey.substring(0, 7)}...${this.anthropicApiKey.slice(-4)}`;
        this.logger.error(`API key present: ${keyPreview} (length: ${this.anthropicApiKey.length})`);
      } else {
        this.logger.error('API key is undefined at time of AI call');
      }
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

  // AI recommendation is stored as a suggestion; admin makes the final decision
  // All scored applicants go to SCORED status regardless of AI recommendation
  private mapRecommendationToStatus(
    _recommendation: ScoringResult['recommendation'],
  ): ApplicantStatus {
    return ApplicantStatus.SCORED;
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
