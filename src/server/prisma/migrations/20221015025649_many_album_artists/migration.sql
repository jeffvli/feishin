/*
  Warnings:

  - You are about to drop the column `albumArtistId` on the `Album` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_albumArtistId_fkey";

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "albumArtistId";

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "albumArtistId" UUID;

-- CreateTable
CREATE TABLE "_AlbumToAlbumArtist" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToAlbumArtist_AB_unique" ON "_AlbumToAlbumArtist"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToAlbumArtist_B_index" ON "_AlbumToAlbumArtist"("B");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_albumArtistId_fkey" FOREIGN KEY ("albumArtistId") REFERENCES "AlbumArtist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToAlbumArtist" ADD CONSTRAINT "_AlbumToAlbumArtist_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToAlbumArtist" ADD CONSTRAINT "_AlbumToAlbumArtist_B_fkey" FOREIGN KEY ("B") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
