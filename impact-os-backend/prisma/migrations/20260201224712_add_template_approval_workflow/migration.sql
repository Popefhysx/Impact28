-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DEPRECATED');

-- AlterTable
ALTER TABLE "CommunicationTemplate" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "previousHtml" TEXT,
ADD COLUMN     "previousSubject" TEXT,
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "imageKey" TEXT;

-- CreateIndex
CREATE INDEX "CommunicationTemplate_status_idx" ON "CommunicationTemplate"("status");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_slug_idx" ON "CommunicationTemplate"("slug");
