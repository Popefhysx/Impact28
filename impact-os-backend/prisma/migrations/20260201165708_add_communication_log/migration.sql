-- CreateEnum
CREATE TYPE "CommunicationSource" AS ENUM ('INTAKE', 'ADMISSION', 'AUTH', 'STAFF', 'SUPPORT', 'MISSION', 'BROADCAST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('USER', 'APPLICANT', 'PARTNER', 'STAFF', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED');

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggerSource" "CommunicationSource" NOT NULL,
    "templateType" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "contentPreview" VARCHAR(200) NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "recipientId" TEXT,
    "recipientType" "RecipientType" NOT NULL,
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "resendId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationLog_recipientEmail_idx" ON "CommunicationLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "CommunicationLog_templateType_idx" ON "CommunicationLog"("templateType");

-- CreateIndex
CREATE INDEX "CommunicationLog_triggerSource_idx" ON "CommunicationLog"("triggerSource");

-- CreateIndex
CREATE INDEX "CommunicationLog_status_idx" ON "CommunicationLog"("status");

-- CreateIndex
CREATE INDEX "CommunicationLog_linkedEntityType_linkedEntityId_idx" ON "CommunicationLog"("linkedEntityType", "linkedEntityId");

-- CreateIndex
CREATE INDEX "CommunicationLog_createdAt_idx" ON "CommunicationLog"("createdAt");
