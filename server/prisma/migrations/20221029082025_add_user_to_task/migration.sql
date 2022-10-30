/*
  Warnings:

  - You are about to drop the column `name` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Task` table. All the data in the column will be lost.
  - Made the column `isError` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "name",
DROP COLUMN "progress",
ADD COLUMN     "userId" UUID,
ALTER COLUMN "isError" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
