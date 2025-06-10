/*
  Warnings:

  - You are about to drop the column `end_time` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "end_time",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60;
