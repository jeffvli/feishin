/*
  Warnings:

  - You are about to drop the column `skip` on the `Song` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ServerFolder_remoteId_key";

-- AlterTable
ALTER TABLE "Song" DROP COLUMN "skip",
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "bitRate" DROP NOT NULL,
ALTER COLUMN "discNumber" DROP NOT NULL;
