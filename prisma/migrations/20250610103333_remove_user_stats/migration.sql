/*
  Warnings:

  - You are about to drop the `user_stats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_stats" DROP CONSTRAINT "user_stats_user_id_fkey";

-- DropTable
DROP TABLE "user_stats";
