/*
  Warnings:

  - You are about to alter the column `proofText` on the `MissionAssignment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- CreateEnum
CREATE TYPE "SupportDenialReason" AS ENUM ('INSUFFICIENT_MOMENTUM', 'NO_ACTIVE_MISSION', 'PHASE_MISMATCH', 'COOLDOWN_ACTIVE', 'BEHAVIORAL_FLAG', 'BUDGET_EXHAUSTED', 'DUPLICATE_REQUEST', 'MANUAL_ADMIN_DECISION');

-- CreateEnum
CREATE TYPE "ProgramPhase" AS ENUM ('ONBOARDING', 'SKILL_BUILDING', 'MARKET_EXPOSURE', 'INCOME_GENERATION', 'CATALYST');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_MOMENTUM', 'MISSED_MISSIONS', 'INACTIVE_7_DAYS', 'TRIAD_IMBALANCE', 'GRADUATION_BLOCK');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('WHATSAPP_STATUS', 'INSTAGRAM', 'FACEBOOK', 'TWITTER_X', 'LINKEDIN', 'TIKTOK', 'OTHER');

-- CreateEnum
CREATE TYPE "WallPostStatus" AS ENUM ('PUBLISHED', 'REMOVED');

-- CreateEnum
CREATE TYPE "StaffCategory" AS ENUM ('ADMIN', 'STAFF', 'OBSERVER');

-- CreateEnum
CREATE TYPE "PsnLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PsnConstraint" AS ENUM ('DATA', 'TRANSPORT', 'TOOLS', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskBadge" AS ENUM ('GREEN', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "DetectionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DetectionAction" AS ENUM ('PROMPT', 'QUEUE', 'ALERT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('BOOK', 'ARTICLE', 'VIDEO', 'PODCAST', 'BLOG');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RSS_FEED', 'YOUTUBE_CHANNEL');

-- CreateEnum
CREATE TYPE "EscalationType" AS ENUM ('SUPPORT_REQUEST', 'PARTICIPANT_CASE', 'APPROVAL_NEEDED', 'DISPUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "EscalationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupportRequestStatus" ADD VALUE 'APPROVED_PENDING_DISBURSE';
ALTER TYPE "SupportRequestStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "SupportType" ADD VALUE 'COUNSELLING';

-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "psnConfidence" DOUBLE PRECISION,
ADD COLUMN     "psnGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "psnLevel" "PsnLevel",
ADD COLUMN     "psnPrimaryConstraint" "PsnConstraint",
ADD COLUMN     "psnScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MissionAssignment" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "reflectionText" VARCHAR(150),
ADD COLUMN     "responseTimeMs" INTEGER,
ALTER COLUMN "proofText" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "SupportRequest" ADD COLUMN     "denialReasonCode" "SupportDenialReason",
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPhase" "ProgramPhase" NOT NULL DEFAULT 'ONBOARDING',
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instagramHandle" TEXT,
ADD COLUMN     "lastCheckIn" TIMESTAMP(3),
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "supportCooldownUntil" TIMESTAMP(3),
ADD COLUMN     "twitterHandle" TEXT;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "StaffCategory" NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" TEXT[],
    "cohortIds" TEXT[],
    "queueIds" TEXT[],
    "participantIds" TEXT[],
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortPsnForecast" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "countHigh" INTEGER NOT NULL,
    "countMedium" INTEGER NOT NULL,
    "countLow" INTEGER NOT NULL,
    "predictedDemandExpected" DOUBLE PRECISION NOT NULL,
    "predictedDemandUpper" DOUBLE PRECISION NOT NULL,
    "predictedDemandLower" DOUBLE PRECISION NOT NULL,
    "riskBadge" "RiskBadge" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortPsnForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsnCalculationLog" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsnCalculationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionTrigger" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" "DetectionSeverity" NOT NULL,
    "actionTaken" "DetectionAction" NOT NULL,
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectionTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTriadScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "technical" INTEGER NOT NULL DEFAULT 0,
    "soft" INTEGER NOT NULL DEFAULT 0,
    "commercial" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTriadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "message" VARCHAR(200),
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" VARCHAR(500),

    CONSTRAINT "InterventionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "caption" VARCHAR(500) NOT NULL,
    "postUrl" VARCHAR(200),
    "usedHashtag" BOOLEAN NOT NULL DEFAULT false,
    "status" "WallPostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "flaggedAt" TIMESTAMP(3),
    "flaggedBy" TEXT,
    "rankScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "canFeature" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "thumbnail" TEXT,
    "skillTracks" "SkillTrack"[],
    "tags" TEXT[],
    "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING',
    "sourceId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "skillTrack" "SkillTrack",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFetched" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "type" "EscalationType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "fromStaffId" TEXT NOT NULL,
    "toStaffId" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "priority" "EscalationPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "EscalationStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" VARCHAR(500),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_category_idx" ON "Staff"("category");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CohortPsnForecast_cohortId_key" ON "CohortPsnForecast"("cohortId");

-- CreateIndex
CREATE INDEX "PsnCalculationLog_applicantId_idx" ON "PsnCalculationLog"("applicantId");

-- CreateIndex
CREATE INDEX "DetectionTrigger_participantId_createdAt_idx" ON "DetectionTrigger"("participantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTriadScore_userId_key" ON "SkillTriadScore"("userId");

-- CreateIndex
CREATE INDEX "InterventionAlert_userId_type_idx" ON "InterventionAlert"("userId", "type");

-- CreateIndex
CREATE INDEX "InterventionAlert_resolvedAt_idx" ON "InterventionAlert"("resolvedAt");

-- CreateIndex
CREATE INDEX "BehaviorLog_userId_eventType_idx" ON "BehaviorLog"("userId", "eventType");

-- CreateIndex
CREATE INDEX "BehaviorLog_timestamp_idx" ON "BehaviorLog"("timestamp");

-- CreateIndex
CREATE INDEX "WallPost_status_rankScore_idx" ON "WallPost"("status", "rankScore");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_url_key" ON "Resource"("url");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Escalation_fromStaffId_idx" ON "Escalation"("fromStaffId");

-- CreateIndex
CREATE INDEX "Escalation_toStaffId_idx" ON "Escalation"("toStaffId");

-- CreateIndex
CREATE INDEX "Escalation_status_idx" ON "Escalation"("status");

-- CreateIndex
CREATE INDEX "Escalation_referenceId_idx" ON "Escalation"("referenceId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortPsnForecast" ADD CONSTRAINT "CohortPsnForecast_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTriadScore" ADD CONSTRAINT "SkillTriadScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionAlert" ADD CONSTRAINT "InterventionAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorLog" ADD CONSTRAINT "BehaviorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResourceSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
