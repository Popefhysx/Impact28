-- CreateEnum
CREATE TYPE "ParticipantState" AS ENUM ('ACTIVE', 'AT_RISK', 'PAUSED', 'EXITED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "CohortPhase" AS ENUM ('PRE_COHORT', 'TRAINING', 'MARKET', 'INCOME', 'EXIT');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('DAY_1_BASELINE', 'DAY_30_SELLABLE_SKILL', 'DAY_60_MARKET_CONTACT', 'DAY_90_INCOME');

-- CreateEnum
CREATE TYPE "GateResult" AS ENUM ('PASS', 'FAIL', 'INTERVENTION_REQUIRED', 'PENDING');

-- AlterTable
ALTER TABLE "Cohort" ADD COLUMN     "currentDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentPhase" "CohortPhase" NOT NULL DEFAULT 'PRE_COHORT',
ADD COLUMN     "orientationDate" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "notificationPrefs" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "exitedAt" TIMESTAMP(3),
ADD COLUMN     "graduatedAt" TIMESTAMP(3),
ADD COLUMN     "participantState" "ParticipantState" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "GateEvaluation" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gateType" "GateType" NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "result" "GateResult" NOT NULL,
    "evaluationData" JSONB NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantStateLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromState" "ParticipantState" NOT NULL,
    "toState" "ParticipantState" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "gateEvaluationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantStateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "performedBy" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GateEvaluation_cohortId_gateType_idx" ON "GateEvaluation"("cohortId", "gateType");

-- CreateIndex
CREATE INDEX "GateEvaluation_userId_gateType_idx" ON "GateEvaluation"("userId", "gateType");

-- CreateIndex
CREATE INDEX "GateEvaluation_result_idx" ON "GateEvaluation"("result");

-- CreateIndex
CREATE INDEX "ParticipantStateLog_userId_createdAt_idx" ON "ParticipantStateLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandAuditLog_targetId_targetType_idx" ON "CommandAuditLog"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "CommandAuditLog_performedBy_idx" ON "CommandAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "CommandAuditLog_createdAt_idx" ON "CommandAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Cohort_currentPhase_idx" ON "Cohort"("currentPhase");

-- CreateIndex
CREATE INDEX "User_participantState_idx" ON "User"("participantState");

-- AddForeignKey
ALTER TABLE "GateEvaluation" ADD CONSTRAINT "GateEvaluation_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateEvaluation" ADD CONSTRAINT "GateEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantStateLog" ADD CONSTRAINT "ParticipantStateLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
