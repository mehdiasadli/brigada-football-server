/*
  Warnings:

  - You are about to drop the column `max_players` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `min_players` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "max_players",
DROP COLUMN "min_players";
