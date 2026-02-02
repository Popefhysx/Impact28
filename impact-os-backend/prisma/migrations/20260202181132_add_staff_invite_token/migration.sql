/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_inviteToken_key" ON "Staff"("inviteToken");

-- CreateIndex
CREATE INDEX "Staff_inviteToken_idx" ON "Staff"("inviteToken");
