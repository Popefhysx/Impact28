/*
  Warnings:

  - Added the required column `updatedAt` to the `Cohort` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('ORIENTATION', 'DEADLINE', 'MILESTONE', 'SESSION', 'OTHER');

-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "type" "CalendarEventType" NOT NULL,
    "description" TEXT,
    "cohortId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "programName" TEXT NOT NULL DEFAULT 'Cycle 28',
    "organizationName" TEXT NOT NULL DEFAULT 'Project 3:10',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@cycle28.org',
    "dashboardUrl" TEXT,
    "otpExpiryMinutes" INTEGER NOT NULL DEFAULT 10,
    "allowSelfSignup" BOOLEAN NOT NULL DEFAULT false,
    "requireOrientation" BOOLEAN NOT NULL DEFAULT true,
    "maxApplicationsPerCohort" INTEGER NOT NULL DEFAULT 50,
    "supportRequestTTLDays" INTEGER NOT NULL DEFAULT 30,
    "autoExpireSupportRequests" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Phase_slug_key" ON "Phase"("slug");

-- CreateIndex
CREATE INDEX "Phase_order_idx" ON "Phase"("order");

-- CreateIndex
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");

-- CreateIndex
CREATE INDEX "CalendarEvent_cohortId_idx" ON "CalendarEvent"("cohortId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
