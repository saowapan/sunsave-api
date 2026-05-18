-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('DETACHED', 'SEMI_DETACHED', 'MID_TERRACE', 'END_TERRACE', 'FLAT', 'BUNGALOW');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('LONDON', 'SOUTH_EAST', 'SOUTH_WEST', 'MIDLANDS', 'NORTH', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('SOUTH', 'SOUTH_EAST', 'SOUTH_WEST', 'EAST', 'WEST', 'NORTH');

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "region" "Region" NOT NULL,
    "roofOrientation" "Orientation" NOT NULL,
    "monthlyBillGbp" DOUBLE PRECISION NOT NULL,
    "systemSizeKw" DOUBLE PRECISION NOT NULL,
    "annualGenerationKwh" DOUBLE PRECISION NOT NULL,
    "annualSavingsGbp" DOUBLE PRECISION NOT NULL,
    "monthlySubscriptionGbp" DOUBLE PRECISION NOT NULL,
    "upfrontPriceGbp" DOUBLE PRECISION NOT NULL,
    "paybackYears" DOUBLE PRECISION NOT NULL,
    "annualCo2SavedKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_createdAt_idx" ON "quotes"("createdAt");
