/*
  Warnings:

  - You are about to drop the `match_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "match_results" DROP CONSTRAINT "match_results_winner_id_fkey";

-- DropTable
DROP TABLE "match_results";
