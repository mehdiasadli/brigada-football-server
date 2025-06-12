/*
  Warnings:

  - You are about to drop the column `is_indoor` on the `venues` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('INDOOR', 'OUTDOOR', 'INDOOR_OUTDOOR');

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "is_indoor",
ADD COLUMN     "type" "VenueType" NOT NULL DEFAULT 'INDOOR_OUTDOOR';
