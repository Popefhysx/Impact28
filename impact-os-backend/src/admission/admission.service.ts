import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService, OfferEmailData } from '../email';
import {
  ApplicantStatus,
  RejectionReason,
} from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Admission Service
 *
 * Handles admin-driven post-scoring actions:
 * - Sending admission offer emails (ADMITTED)
 * - Sending rejection emails (REJECTED)
 * - Waitlisting applicants (WAITLIST)
 */

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

      case ApplicantStatus.WAITLIST:
        // Waitlist doesn't get immediate email, handled separately
        this.logger.log(`Applicant ${applicantId} added to waitlist`);
        break;

      case ApplicantStatus.REJECTED:
        await this.handleRejection(applicant);
        break;

      default:
        this.logger.warn(
          `Unexpected status ${applicant.status} for ${applicantId}`,
        );
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

    // Fetch admission statistics for the celebratory email
    const [totalApplicants, admittedCount] = await Promise.all([
      this.prisma.applicant.count(),
      this.prisma.applicant.count({
        where: { status: ApplicantStatus.ADMITTED },
      }),
    ]);

    // Send personalized offer email with Skill Triad
    const offerData: OfferEmailData = {
      firstName: applicant.firstName,
      offerType: applicant.offerType || 'FULL_SUPPORT',
      triadTechnical: applicant.triadTechnical || 50,
      triadSoft: applicant.triadSoft || 50,
      triadCommercial: applicant.triadCommercial || 50,
      primaryFocus: applicant.primaryFocus || 'COMMERCIAL',
      kpiTargets: applicant.kpiTargets,
      acceptLink,
      declineLink,
      totalApplicants,
      admittedCount,
    };

    await this.emailService.sendOfferEmail(applicant.email, offerData);

    this.logger.log(
      `Sent personalized offer email to ${applicant.email} (token: ${offerToken.substring(0, 8)}..., stats: ${admittedCount}/${totalApplicants})`,
    );
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

    await this.emailService.sendReadinessRejectionEmail(applicant.email, {
      firstName: applicant.firstName,
      readinessScore,
      primaryGap,
      isCapacityRejection,
      customMessage,
    });

    this.logger.log(
      `Sent readiness-tiered rejection email to ${applicant.email} (score: ${readinessScore})`,
    );
  }

  /**
   * Map rejection reason to a human-readable primary gap
   */
  private mapRejectionToGap(
    reason: RejectionReason | null,
  ): string | undefined {
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
   * Format rejection reason for email
   */
  private formatRejectionReason(
    reason: RejectionReason | null,
  ): string | undefined {
    if (!reason) return undefined;

    const reasonMap: Record<RejectionReason, string> = {
      [RejectionReason.AGE_INELIGIBLE]:
        'Our program is designed for participants aged 18-30.',
      [RejectionReason.LOCATION_UNSUPPORTED]:
        'We currently only operate in Nigeria.',
      [RejectionReason.LOW_READINESS]:
        'Based on your responses, we believe you may need more time to prepare for this commitment.',
      [RejectionReason.INCOMPLETE_FORM]: 'Your application was incomplete.',
      [RejectionReason.DUPLICATE]: 'We found a duplicate application.',
      [RejectionReason.NO_DEVICE]:
        'Consistent device access is required for this program.',
      [RejectionReason.NO_INTERNET]:
        'Reliable internet access is required for this program.',
      [RejectionReason.NO_CONSENT]:
        'You did not agree to the required program commitments.',
      [RejectionReason.STAFF_DECISION]:
        'This decision was made after careful review by our team.',
    };

    return reasonMap[reason] || undefined;
  }
}
