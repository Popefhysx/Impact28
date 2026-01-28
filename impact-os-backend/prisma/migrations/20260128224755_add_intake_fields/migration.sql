-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('FULL_SUPPORT', 'SKILLS_ONLY', 'ACCELERATOR', 'CATALYST_TRACK');

-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "currentMonthlyIncome" INTEGER,
ADD COLUMN     "incomeSource" TEXT,
ADD COLUMN     "kpiTargets" JSONB,
ADD COLUMN     "offerType" "OfferType",
ADD COLUMN     "primaryFocus" "SkillDomain",
ADD COLUMN     "receivesStipend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triadCommercial" DOUBLE PRECISION,
ADD COLUMN     "triadSoft" DOUBLE PRECISION,
ADD COLUMN     "triadTechnical" DOUBLE PRECISION;
