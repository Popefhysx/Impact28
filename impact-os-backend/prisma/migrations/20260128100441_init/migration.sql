-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'WHATSAPP', 'REFERRAL', 'ALUMNI', 'CHURCH', 'SCHOOL', 'EVENT', 'RADIO_TV', 'OTHER');

-- CreateEnum
CREATE TYPE "CurrentStatus" AS ENUM ('UNEMPLOYED', 'UNDEREMPLOYED', 'STUDENT', 'CAREGIVER', 'BETWEEN_JOBS', 'STRUGGLING_BUSINESS');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SECONDARY', 'OND_HND', 'BACHELORS', 'MASTERS_PLUS', 'IN_SCHOOL', 'NO_FORMAL');

-- CreateEnum
CREATE TYPE "InternetAccess" AS ENUM ('YES', 'NO', 'SOMETIMES');

-- CreateEnum
CREATE TYPE "WeeklyHours" AS ENUM ('UNDER_5', 'FIVE_TO_TEN', 'TEN_TO_TWENTY', 'TWENTY_PLUS');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('PHONE', 'LAPTOP', 'SHARED_PHONE', 'SHARED_LAPTOP');

-- CreateEnum
CREATE TYPE "SkillTrack" AS ENUM ('GRAPHICS_DESIGN', 'DIGITAL_MARKETING', 'WEB_DESIGN', 'VIDEO_PRODUCTION', 'AI_FOR_BUSINESS', 'MUSIC_PRODUCTION', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('STARTED', 'PARTIAL', 'PENDING', 'SCORING', 'ADMITTED', 'CONDITIONAL', 'REJECTED', 'WAITLIST', 'CONVERTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('AGE_INELIGIBLE', 'LOCATION_UNSUPPORTED', 'LOW_READINESS', 'INCOMPLETE_FORM', 'DUPLICATE', 'NO_DEVICE', 'NO_INTERNET', 'NO_CONSENT', 'STAFF_DECISION');

-- CreateEnum
CREATE TYPE "ConditionalTaskType" AS ENUM ('OUTREACH_PROOF', 'WHY_STATEMENT', 'TIME_AUDIT', 'INTRO_QUIZ');

-- CreateEnum
CREATE TYPE "IdentityLevel" AS ENUM ('L0_APPLICANT', 'L1_ACTIVATED', 'L2_SKILLED', 'L3_EXPOSED', 'L4_EARNER', 'L5_CATALYST');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('MOMENTUM', 'SKILL_XP', 'ARENA_POINTS', 'INCOME_PROOF');

-- CreateEnum
CREATE TYPE "SkillDomain" AS ENUM ('TECHNICAL', 'SOFT', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FailureType" AS ENUM ('MARKET_REJECTION', 'NON_RESPONSE', 'OFFER_DECLINED', 'MISSED_DEADLINE', 'AVOIDANCE', 'BURNOUT_DIP');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('FREELANCE', 'CLIENT_WORK', 'RETAINER', 'CONTENT_PAYMENT');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('SCREENSHOT', 'BANK_STATEMENT', 'PLATFORM_EXPORT', 'CLIENT_CONFIRMATION');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CheckInType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SponsorType" AS ENUM ('ONE_MONTH', 'FULL_PROGRAM', 'CUSTOM', 'CORPORATE');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('TRAINING_PARTNER', 'EMPLOYMENT_PARTNER', 'VENUE_PARTNER', 'CONTENT_PARTNER', 'MEDIA_PARTNER', 'CHURCH_PARTNER', 'SCHOOL_PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_DISCUSSION', 'CONVERTED', 'DECLINED', 'UNRESPONSIVE');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(25) NOT NULL,
    "lastName" VARCHAR(25) NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "state" TEXT,
    "gender" "Gender" NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "currentStatus" "CurrentStatus",
    "educationLevel" "EducationLevel",
    "biggestChallenge" VARCHAR(150),
    "hasInternet" "InternetAccess",
    "weeklyHours" "WeeklyHours",
    "primaryDevice" "DeviceType",
    "skillTrack" "SkillTrack",
    "triedOnlineEarning" BOOLEAN,
    "onlineEarningOutcome" VARCHAR(200),
    "triedLearningSkill" BOOLEAN,
    "technicalProbe" VARCHAR(300),
    "commercialProbe" VARCHAR(300),
    "exposureProbe" VARCHAR(300),
    "commitmentProbe" VARCHAR(300),
    "consentDailyAction" BOOLEAN NOT NULL DEFAULT false,
    "consentWeeklyCheckin" BOOLEAN NOT NULL DEFAULT false,
    "consentFailure" BOOLEAN NOT NULL DEFAULT false,
    "consentData" BOOLEAN NOT NULL DEFAULT false,
    "readinessScore" DOUBLE PRECISION,
    "actionOrientation" DOUBLE PRECISION,
    "marketAwareness" DOUBLE PRECISION,
    "rejectionResilience" DOUBLE PRECISION,
    "commitmentSignal" DOUBLE PRECISION,
    "diagnosticReport" JSONB,
    "riskFlags" TEXT[],
    "aiRecommendation" TEXT,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'STARTED',
    "rejectionReason" "RejectionReason",
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedSections" INTEGER NOT NULL DEFAULT 0,
    "lastSectionAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "resumeToken" TEXT,
    "resumeTokenExpiresAt" TIMESTAMP(3),
    "resumeEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "deviceDetected" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referralCode" TEXT,
    "cohortId" TEXT,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionalTask" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "type" "ConditionalTaskType" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "proofUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConditionalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "identityLevel" "IdentityLevel" NOT NULL DEFAULT 'L1_ACTIVATED',
    "applicantId" TEXT,
    "cohortId" TEXT,
    "skillTrack" "SkillTrack",
    "avatarUrl" TEXT,
    "bio" TEXT,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortConfig" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "applicationsOpen" BOOLEAN NOT NULL DEFAULT true,
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "disabledTracks" TEXT[],
    "founderMessageTitle" TEXT NOT NULL DEFAULT 'Welcome to the Journey!',
    "founderMessageBody" TEXT NOT NULL DEFAULT 'I''m so excited to have you join us. You''ve taken the first step toward transforming your future. Check your email for next steps, and remember: every expert was once a beginner.',
    "founderName" TEXT NOT NULL DEFAULT 'Pope',
    "founderImageUrl" TEXT,
    "founderSignatureUrl" TEXT,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CohortConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyType" "CurrencyType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "missionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillDomain" "SkillDomain" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "momentum" INTEGER NOT NULL DEFAULT 0,
    "skillXp" INTEGER NOT NULL DEFAULT 0,
    "arenaPoints" INTEGER NOT NULL DEFAULT 0,
    "requiredLevel" "IdentityLevel" NOT NULL DEFAULT 'L1_ACTIVATED',
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "isWeekly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "proofUrl" TEXT,
    "proofText" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),

    CONSTRAINT "MissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailureRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "failureType" "FailureType" NOT NULL,
    "context" TEXT,
    "missionId" TEXT,
    "aiClassified" BOOLEAN NOT NULL DEFAULT false,
    "severity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "amountUSD" DECIMAL(65,30),
    "source" "IncomeSource" NOT NULL,
    "platform" TEXT,
    "clientName" TEXT,
    "description" TEXT NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "proofType" "ProofType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CheckInType" NOT NULL,
    "mood" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "skills" TEXT[],
    "imageUrl" TEXT,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayOrder" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organizationType" TEXT,
    "interestType" "SponsorType" NOT NULL,
    "amountInterest" TEXT,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "notes" TEXT,
    "followedUpAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInquiry" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "partnershipType" "PartnerType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "notes" TEXT,
    "followedUpAt" TIMESTAMP(3),
    "partnershipStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_resumeToken_key" ON "Applicant"("resumeToken");

-- CreateIndex
CREATE INDEX "Applicant_status_idx" ON "Applicant"("status");

-- CreateIndex
CREATE INDEX "Applicant_email_idx" ON "Applicant"("email");

-- CreateIndex
CREATE INDEX "Applicant_source_idx" ON "Applicant"("source");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_applicantId_key" ON "User"("applicantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_identityLevel_idx" ON "User"("identityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "CohortConfig_cohortId_key" ON "CohortConfig"("cohortId");

-- CreateIndex
CREATE INDEX "CurrencyLedger_userId_currencyType_idx" ON "CurrencyLedger"("userId", "currencyType");

-- CreateIndex
CREATE INDEX "MissionAssignment_userId_status_idx" ON "MissionAssignment"("userId", "status");

-- CreateIndex
CREATE INDEX "FailureRecord_userId_failureType_idx" ON "FailureRecord"("userId", "failureType");

-- CreateIndex
CREATE INDEX "IncomeRecord_userId_status_idx" ON "IncomeRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "CheckIn_userId_createdAt_idx" ON "CheckIn"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");

-- CreateIndex
CREATE INDEX "SponsorInquiry_status_idx" ON "SponsorInquiry"("status");

-- CreateIndex
CREATE INDEX "SponsorInquiry_email_idx" ON "SponsorInquiry"("email");

-- CreateIndex
CREATE INDEX "PartnerInquiry_status_idx" ON "PartnerInquiry"("status");

-- CreateIndex
CREATE INDEX "PartnerInquiry_email_idx" ON "PartnerInquiry"("email");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionalTask" ADD CONSTRAINT "ConditionalTask_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortConfig" ADD CONSTRAINT "CohortConfig_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyLedger" ADD CONSTRAINT "CurrencyLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAssignment" ADD CONSTRAINT "MissionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAssignment" ADD CONSTRAINT "MissionAssignment_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailureRecord" ADD CONSTRAINT "FailureRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
