import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import { ScoringService } from '../scoring';
import { ProgressService } from '../progress';
import { AuthService } from '../auth';
import {
  StartApplicationDto,
  Section2Dto,
  Section3Dto,
  Section4Dto,
  Section5Dto,
  Section6Dto,
} from './dto';
import {
  ApplicantStatus,
  IntakeIncomeSource,
  CurrentStatus,
  EducationLevel,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class IntakeService {
  private readonly logger = new Logger(IntakeService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private scoringService: ScoringService,
    private progressService: ProgressService,
    private authService: AuthService,
  ) { }

  // Start a new application (Section 1)
  async startApplication(dto: StartApplicationDto) {
    // Check for existing application
    const existing = await this.prisma.applicant.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      // If incomplete, return it for resumption
      if (
        existing.status === ApplicantStatus.STARTED ||
        existing.status === ApplicantStatus.PARTIAL
      ) {
        return {
          id: existing.id,
          status: existing.status,
          completedSections: existing.completedSections,
          message:
            'Existing application found. You can continue where you left off.',
          isResume: true,
        };
      }
      throw new ConflictException(
        'An application with this email already exists.',
      );
    }

    // Generate resume token
    const resumeToken = crypto.randomBytes(32).toString('hex');
    const resumeTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const applicant = await this.prisma.applicant.create({
      data: {
        ...dto,
        status: ApplicantStatus.STARTED,
        completedSections: 1,
        lastSectionAt: new Date(),
        resumeToken,
        resumeTokenExpiresAt,
      },
    });

    return {
      id: applicant.id,
      status: applicant.status,
      completedSections: applicant.completedSections,
      resumeToken: applicant.resumeToken,
      message: 'Application started successfully.',
      isResume: false,
    };
  }

  // Update Section 2
  async updateSection2(id: string, dto: Section2Dto) {
    const applicant = await this.findApplicant(id);
    this.validateSectionOrder(applicant.completedSections, 2);

    // Normalize Data Mismatch from Marketing Site
    // 1. Map incomeSource -> intakeIncomeSource
    let intakeIncomeSource = dto.intakeIncomeSource;
    if (!intakeIncomeSource && dto.incomeSource) {
      // Simple mapping or default to OTHER if unknown
      const source = dto.incomeSource.toUpperCase().replace(/\s+/g, '_');
      // Try to match IntakeIncomeSource enum
      if ((Object.values(IntakeIncomeSource) as string[]).includes(source)) {
        intakeIncomeSource = source as IntakeIncomeSource;
      } else {
        intakeIncomeSource = IntakeIncomeSource.OTHER; // Fallback
      }
    }

    // 2. Normalize Enums (human readable -> SCREAMING_SNAKE_CASE)
    let currentStatus = dto.currentStatus;
    if (dto.currentStatus && typeof dto.currentStatus === 'string') {
      const status = dto.currentStatus.toUpperCase().replace(/\s+/g, '_');
      if ((Object.values(CurrentStatus) as string[]).includes(status)) {
        currentStatus = status as CurrentStatus;
      }
    }

    let educationLevel = dto.educationLevel;
    if (dto.educationLevel && typeof dto.educationLevel === 'string') {
      const edu = dto.educationLevel.toUpperCase().replace(/\s+/g, '_');
      if ((Object.values(EducationLevel) as string[]).includes(edu)) {
        educationLevel = edu as EducationLevel;
      }
    }

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        // Override with normalized values (cast to enum types)
        currentStatus: currentStatus as CurrentStatus | undefined,
        educationLevel: educationLevel as EducationLevel | undefined,
        intakeIncomeSource: intakeIncomeSource,
        status: ApplicantStatus.PARTIAL,
        completedSections: Math.max(applicant.completedSections, 2),
        lastSectionAt: new Date(),
      },
      select: this.defaultSelect,
    });
  }

  // Update Section 3
  async updateSection3(id: string, dto: Section3Dto) {
    const applicant = await this.findApplicant(id);
    this.validateSectionOrder(applicant.completedSections, 3);

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        completedSections: Math.max(applicant.completedSections, 3),
        lastSectionAt: new Date(),
      },
      select: this.defaultSelect,
    });
  }

  // Update Section 4
  async updateSection4(id: string, dto: Section4Dto) {
    const applicant = await this.findApplicant(id);
    this.validateSectionOrder(applicant.completedSections, 4);

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        completedSections: Math.max(applicant.completedSections, 4),
        lastSectionAt: new Date(),
      },
      select: this.defaultSelect,
    });
  }

  // Update Section 5
  async updateSection5(id: string, dto: Section5Dto) {
    const applicant = await this.findApplicant(id);
    this.validateSectionOrder(applicant.completedSections, 5);

    return this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        completedSections: Math.max(applicant.completedSections, 5),
        lastSectionAt: new Date(),
      },
      select: this.defaultSelect,
    });
  }

  // Submit application (Section 6 - final)
  async submitApplication(id: string, dto: Section6Dto) {
    const applicant = await this.findApplicant(id);

    if (applicant.completedSections < 5) {
      throw new BadRequestException(
        'Please complete all sections before submitting.',
      );
    }

    // Validate all consents
    if (
      !dto.consentDailyAction ||
      !dto.consentWeeklyCheckin ||
      !dto.consentFailure ||
      !dto.consentData
    ) {
      throw new BadRequestException(
        'All consent checkboxes must be checked to submit.',
      );
    }

    const submitted = await this.prisma.applicant.update({
      where: { id },
      data: {
        ...dto,
        status: ApplicantStatus.PENDING,
        completedSections: 6,
        submittedAt: new Date(),
        lastSectionAt: new Date(),
      },
      select: {
        ...this.defaultSelect,
        email: true,
        firstName: true,
        lastName: true,
        skillTrack: true,
      },
    });

    // Send confirmation email to applicant
    await this.emailService.sendApplicationReceived(
      submitted.email,
      submitted.firstName,
    );

    // Send admin alert email (async, non-blocking)
    this.emailService
      .sendAdminNewApplicationAlert({
        firstName: submitted.firstName,
        lastName: submitted.lastName || '',
        email: submitted.email,
        skillTrack: submitted.skillTrack || undefined,
        applicantId: submitted.id,
      })
      .catch((error: Error) => {
        this.logger.error(`Admin alert failed for ${submitted.id}: ${error.message}`, error.stack);
      });

    // Trigger AI scoring (async, non-blocking)
    this.scoringService
      .scoreApplicant(id)
      .then((result) => {
        this.logger.log(
          `Scored ${id}: ${result.recommendation} (${result.readinessScore.toFixed(2)})`,
        );
      })
      .catch((error: Error) => {
        this.logger.error(`Scoring failed for ${id}: ${error.message}`, error.stack);
      });

    return {
      id: submitted.id,
      status: submitted.status,
      completedSections: submitted.completedSections,
      message:
        'Application submitted successfully! We will review it within 48 hours.',
    };
  }

  // Resume application with token
  async resumeWithToken(token: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: {
        resumeToken: token,
        resumeTokenExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        completedSections: true,
        status: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException('Invalid or expired resume link.');
    }

    return {
      ...applicant,
      nextSection: applicant.completedSections + 1,
    };
  }

  // Get application status
  async getStatus(id: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        completedSections: true,
        readinessScore: true,
        aiRecommendation: true,
        rejectionReason: true,
        submittedAt: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException('Application not found.');
    }

    return applicant;
  }

  // Get application by email (for resume)
  async findByEmail(email: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { email },
      select: {
        id: true,
        completedSections: true,
        status: true,
        resumeToken: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException('No application found for this email.');
    }

    return applicant;
  }

  // Private helpers
  private async findApplicant(id: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { id },
    });

    if (!applicant) {
      throw new NotFoundException('Application not found.');
    }

    if (
      applicant.status === ApplicantStatus.PENDING ||
      applicant.status === ApplicantStatus.ADMITTED ||
      applicant.status === ApplicantStatus.REJECTED
    ) {
      throw new BadRequestException(
        'This application has already been submitted and cannot be edited.',
      );
    }

    return applicant;
  }

  private validateSectionOrder(
    completedSections: number,
    targetSection: number,
  ) {
    if (completedSections < targetSection - 1) {
      throw new BadRequestException(
        `Please complete section ${targetSection - 1} first.`,
      );
    }
  }

  /**
   * Accept offer - validate token and convert Applicant to User
   * User provides their own username and PIN
   * If applicant's skillTrack is UNDECIDED, they must select a track
   */
  async acceptOffer(token: string, username: string, pin: string, skillTrack?: string) {
    const bcrypt = await import('bcrypt');

    const applicant = await this.prisma.applicant.findUnique({
      where: { offerToken: token },
    });

    if (!applicant) {
      throw new NotFoundException('Invalid or expired offer token');
    }

    // Check token expiration
    if (
      applicant.offerTokenExpiresAt &&
      new Date() > applicant.offerTokenExpiresAt
    ) {
      throw new BadRequestException(
        'Offer has expired. Please contact support.',
      );
    }

    // Check status - must be ADMITTED
    if (applicant.status !== ApplicantStatus.ADMITTED) {
      throw new BadRequestException(
        'This application is not in ADMITTED status',
      );
    }

    // Handle UNDECIDED skill track — applicant must select during acceptance
    const validTracks = ['GRAPHICS_DESIGN', 'DIGITAL_MARKETING', 'WEB_DESIGN', 'VIDEO_PRODUCTION', 'AI_FOR_BUSINESS', 'MUSIC_PRODUCTION'];
    let finalSkillTrack = applicant.skillTrack;

    if (applicant.skillTrack === 'UNDECIDED') {
      if (!skillTrack || !validTracks.includes(skillTrack)) {
        throw new BadRequestException(
          `You must select a skill track. Valid options: ${validTracks.join(', ')}`,
        );
      }
      finalSkillTrack = skillTrack as any;

      // Update applicant record with chosen track
      await this.prisma.applicant.update({
        where: { id: applicant.id },
        data: { skillTrack: skillTrack as any },
      });
    }

    // Validate username format
    const normalizedUsername = username.toLowerCase().trim();
    if (!/^[a-z][a-z0-9._]{2,}$/.test(normalizedUsername)) {
      throw new BadRequestException(
        'Username must start with a letter and contain only lowercase letters, numbers, dots, and underscores (min 3 characters)',
      );
    }

    // Check username uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Username is already taken. Please choose a different one.',
      );
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    // Hash the PIN for secure storage
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create User from Applicant (convert) - link via relation
    const user = await this.prisma.user.create({
      data: {
        email: applicant.email,
        firstName: applicant.firstName,
        lastName: applicant.lastName || '',
        whatsapp: applicant.whatsapp || undefined,
        skillTrack: finalSkillTrack,
        // Link to original applicant record (assessment data lives there)
        applicantId: applicant.id,
        // User-chosen authentication credentials (PIN is hashed)
        username: normalizedUsername,
        pin: hashedPin,
      },
    });

    // Update applicant record to mark as converted
    await this.prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        status: ApplicantStatus.CONVERTED,
        convertedAt: new Date(),
        offerToken: null, // Clear the token
      },
    });

    // Initialize progress (momentum, missions) for new user
    await this.progressService.initializeProgress(user.id);

    this.logger.log(
      `Applicant ${applicant.id} accepted offer and converted to user ${user.id} (username: ${normalizedUsername})`,
    );

    return {
      success: true,
      message: 'Welcome to Project 3:10! Your journey begins now.',
      userId: user.id,
      username: normalizedUsername,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };
  }

  /**
   * Decline offer - archive the applicant
   */
  async declineOffer(token: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { offerToken: token },
    });

    if (!applicant) {
      throw new NotFoundException('Invalid or expired offer token');
    }

    // Update status to DECLINED (we may need to add this status)
    await this.prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        status: ApplicantStatus.REJECTED, // Archive as rejected
        rejectionReason: 'STAFF_DECISION', // Reusing existing reason
        offerToken: null, // Clear the token
      },
    });

    this.logger.log(`Applicant ${applicant.id} declined offer`);

    return {
      success: true,
      message: 'We understand. We hope to see you in a future cohort.',
    };
  }

  /**
   * Validate offer token (for frontend pre-check)
   */
  async validateOfferToken(token: string) {
    const applicant = await this.prisma.applicant.findUnique({
      where: { offerToken: token },
      select: {
        firstName: true,
        email: true,
        status: true,
        skillTrack: true,
        offerTokenExpiresAt: true,
      },
    });

    if (!applicant) {
      throw new NotFoundException('Invalid or expired offer token');
    }

    // Check token expiration
    if (
      applicant.offerTokenExpiresAt &&
      new Date() > applicant.offerTokenExpiresAt
    ) {
      throw new BadRequestException(
        'Offer has expired. Please contact support.',
      );
    }

    // Check status
    if (applicant.status !== ApplicantStatus.ADMITTED) {
      throw new BadRequestException('This offer is no longer valid');
    }

    return {
      valid: true,
      firstName: applicant.firstName,
      email: applicant.email,
      skillTrack: applicant.skillTrack,
      needsTrackSelection: applicant.skillTrack === 'UNDECIDED',
    };
  }

  private defaultSelect = {
    id: true,
    status: true,
    completedSections: true,
    lastSectionAt: true,
  };
}
