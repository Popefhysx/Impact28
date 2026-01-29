/*
  Warnings:

  - A unique constraint covering the columns `[offerToken]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "offerToken" TEXT,
ADD COLUMN     "offerTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_offerToken_key" ON "Applicant"("offerToken");
