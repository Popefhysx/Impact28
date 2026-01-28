-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('DATA', 'TRANSPORT', 'TOOLS', 'CASH');

-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalTier" AS ENUM ('AUTO', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "DisbursementType" AS ENUM ('DATA_TOPUP', 'VOUCHER', 'TOOL_ACCESS', 'CASH_TRANSFER');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SupportWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allocatedBudget" DOUBLE PRECISION NOT NULL,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankCode" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SupportType" NOT NULL,
    "missionId" TEXT,
    "justification" VARCHAR(200) NOT NULL,
    "evidence" TEXT,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvalTier" "ApprovalTier",
    "approverId" TEXT,
    "reasonCode" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisbursementLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cohortId" TEXT,
    "type" "DisbursementType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "providerStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DisbursementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportWallet_userId_key" ON "SupportWallet"("userId");

-- CreateIndex
CREATE INDEX "SupportRequest_userId_status_idx" ON "SupportRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "DisbursementLog_userId_idx" ON "DisbursementLog"("userId");

-- CreateIndex
CREATE INDEX "DisbursementLog_status_idx" ON "DisbursementLog"("status");

-- AddForeignKey
ALTER TABLE "SupportWallet" ADD CONSTRAINT "SupportWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementLog" ADD CONSTRAINT "DisbursementLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SupportRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
