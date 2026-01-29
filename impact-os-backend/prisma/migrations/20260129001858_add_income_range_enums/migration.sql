/*
  Warnings:

  - You are about to drop the column `currentMonthlyIncome` on the `Applicant` table. All the data in the column will be lost.
  - You are about to drop the column `incomeSource` on the `Applicant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('ZERO', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IntakeIncomeSource" AS ENUM ('NONE', 'FREELANCE', 'EMPLOYMENT', 'BUSINESS', 'FAMILY', 'OTHER');

-- AlterTable
ALTER TABLE "Applicant" DROP COLUMN "currentMonthlyIncome",
DROP COLUMN "incomeSource",
ADD COLUMN     "incomeRange" "IncomeRange",
ADD COLUMN     "intakeIncomeSource" "IntakeIncomeSource";
