-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('LEAD', 'QUALIFIED', 'APPROVED', 'ACTIVE', 'PAUSED', 'CHURNED');

-- CreateEnum
CREATE TYPE "PartnerUserRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "CommitmentType" AS ENUM ('RECURRING', 'ONE_OFF', 'COHORT_SPONSOR', 'CAPACITY_POOL', 'PLEDGE_PENDING');

-- CreateEnum
CREATE TYPE "CommitmentCadence" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FundingLedgerType" AS ENUM ('COMMITMENT_CREATED', 'ALLOCATION_RELEASED', 'DISBURSEMENT', 'ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PartnerReportType" AS ENUM ('COHORT_INTERIM', 'COHORT_FINAL', 'ANNUAL_IMPACT', 'CUSTOM');

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'LEAD',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "primaryEmail" TEXT NOT NULL,
    "primaryPhone" TEXT,
    "website" TEXT,
    "internalNotes" TEXT,
    "riskFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerUser" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "role" "PartnerUserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingCommitment" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" "CommitmentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "cadence" "CommitmentCadence",
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetCohortSize" INTEGER,
    "targetRegion" TEXT,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "totalAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentAllocation" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "participantCount" INTEGER,
    "status" "AllocationStatus" NOT NULL DEFAULT 'PLANNED',
    "releaseDate" TIMESTAMP(3),
    "releasedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitmentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingLedger" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "type" "FundingLedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "cohortId" TEXT,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerReport" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "cohortId" TEXT,
    "type" "PartnerReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerUser_email_key" ON "PartnerUser"("email");

-- CreateIndex
CREATE INDEX "FundingCommitment_partnerId_status_idx" ON "FundingCommitment"("partnerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommitmentAllocation_commitmentId_cohortId_key" ON "CommitmentAllocation"("commitmentId", "cohortId");

-- CreateIndex
CREATE INDEX "FundingLedger_commitmentId_idx" ON "FundingLedger"("commitmentId");

-- AddForeignKey
ALTER TABLE "PartnerUser" ADD CONSTRAINT "PartnerUser_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingCommitment" ADD CONSTRAINT "FundingCommitment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentAllocation" ADD CONSTRAINT "CommitmentAllocation_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "FundingCommitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentAllocation" ADD CONSTRAINT "CommitmentAllocation_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingLedger" ADD CONSTRAINT "FundingLedger_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "FundingCommitment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
