CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "ServerType" AS ENUM ('SUBSONIC', 'JELLYFIN', 'NAVIDROME');

-- CreateEnum
CREATE TYPE "ServerPermissionType" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ExternalSource" AS ENUM ('MUSICBRAINZ', 'LASTFM', 'THEAUDIODB', 'SPOTIFY');

-- CreateEnum
CREATE TYPE "ExternalType" AS ENUM ('ID', 'LINK');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('PRIMARY', 'BACKDROP', 'LOGO', 'SCREENSHOT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('FULL_SCAN', 'QUICK_SCAN', 'REFRESH', 'SPOTIFY', 'MUSICBRAINZ', 'LASTFM');

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "remoteUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "ServerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" UUID,
    "serverId" UUID NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerPermissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ServerPermissionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "serverId" UUID NOT NULL,

    CONSTRAINT "ServerPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerUrl" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" UUID NOT NULL,

    CONSTRAINT "ServerUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerFolder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "serverId" UUID NOT NULL,

    CONSTRAINT "ServerFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerFolderPermissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "serverFolderId" UUID NOT NULL,

    CONSTRAINT "ServerFolderPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumArtistRating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "albumArtistId" UUID NOT NULL,

    CONSTRAINT "AlbumArtistRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistRating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "artistId" UUID NOT NULL,

    CONSTRAINT "ArtistRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumRating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "albumId" UUID NOT NULL,

    CONSTRAINT "AlbumRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongRating" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "songId" UUID,

    CONSTRAINT "SongRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT,
    "remoteUrl" TEXT NOT NULL,
    "type" "ImageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "External" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "type" "ExternalType" NOT NULL,
    "source" "ExternalSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "External_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumArtist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "biography" TEXT,
    "remoteId" TEXT NOT NULL,
    "remoteCreatedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" UUID NOT NULL,

    CONSTRAINT "AlbumArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "releaseYear" INTEGER,
    "remoteId" TEXT NOT NULL,
    "remoteCreatedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "albumArtistId" UUID,
    "serverId" UUID NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "biography" TEXT,
    "remoteId" TEXT NOT NULL,
    "remoteCreatedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" UUID NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sortName" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "releaseYear" INTEGER,
    "duration" DOUBLE PRECISION NOT NULL,
    "size" TEXT,
    "lyrics" TEXT,
    "bitRate" INTEGER NOT NULL,
    "container" TEXT NOT NULL,
    "discNumber" INTEGER NOT NULL DEFAULT 1,
    "trackNumber" INTEGER,
    "artistName" TEXT,
    "remoteId" TEXT NOT NULL,
    "remoteCreatedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "albumId" UUID,
    "serverId" UUID NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "message" TEXT,
    "progress" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "isError" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" UUID NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HistoryToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_FolderToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_FolderToServerFolder" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ServerFolderToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_GenreToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_FavoriteToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ImageToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ExternalToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumArtistToGenre" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumArtistToExternal" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumArtistToServerFolder" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumArtistToImage" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumArtistToFavorite" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToGenre" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToArtist" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToExternal" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToServerFolder" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToImage" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToFavorite" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToGenre" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToSong" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToExternal" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToServerFolder" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToImage" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistToFavorite" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_deviceId_key" ON "User"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_url_key" ON "Server"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_serverId_path_key" ON "Folder"("serverId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "ServerPermissions_userId_serverId_key" ON "ServerPermissions"("userId", "serverId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerUrl_serverId_url_key" ON "ServerUrl"("serverId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "ServerFolder_remoteId_key" ON "ServerFolder"("remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerFolder_serverId_remoteId_key" ON "ServerFolder"("serverId", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerFolderPermissions_userId_serverFolderId_key" ON "ServerFolderPermissions"("userId", "serverFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Image_remoteUrl_type_key" ON "Image"("remoteUrl", "type");

-- CreateIndex
CREATE UNIQUE INDEX "External_value_source_key" ON "External"("value", "source");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumArtist_serverId_remoteId_key" ON "AlbumArtist"("serverId", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_serverId_remoteId_key" ON "Album"("serverId", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_serverId_remoteId_key" ON "Artist"("serverId", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Song_serverId_remoteId_key" ON "Song"("serverId", "remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "_HistoryToSong_AB_unique" ON "_HistoryToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_HistoryToSong_B_index" ON "_HistoryToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FolderToSong_AB_unique" ON "_FolderToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_FolderToSong_B_index" ON "_FolderToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FolderToServerFolder_AB_unique" ON "_FolderToServerFolder"("A", "B");

-- CreateIndex
CREATE INDEX "_FolderToServerFolder_B_index" ON "_FolderToServerFolder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServerFolderToSong_AB_unique" ON "_ServerFolderToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_ServerFolderToSong_B_index" ON "_ServerFolderToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToSong_AB_unique" ON "_GenreToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToSong_B_index" ON "_GenreToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FavoriteToSong_AB_unique" ON "_FavoriteToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_FavoriteToSong_B_index" ON "_FavoriteToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToSong_AB_unique" ON "_ImageToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToSong_B_index" ON "_ImageToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExternalToSong_AB_unique" ON "_ExternalToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_ExternalToSong_B_index" ON "_ExternalToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumArtistToGenre_AB_unique" ON "_AlbumArtistToGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumArtistToGenre_B_index" ON "_AlbumArtistToGenre"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumArtistToExternal_AB_unique" ON "_AlbumArtistToExternal"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumArtistToExternal_B_index" ON "_AlbumArtistToExternal"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumArtistToServerFolder_AB_unique" ON "_AlbumArtistToServerFolder"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumArtistToServerFolder_B_index" ON "_AlbumArtistToServerFolder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumArtistToImage_AB_unique" ON "_AlbumArtistToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumArtistToImage_B_index" ON "_AlbumArtistToImage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumArtistToFavorite_AB_unique" ON "_AlbumArtistToFavorite"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumArtistToFavorite_B_index" ON "_AlbumArtistToFavorite"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToGenre_AB_unique" ON "_AlbumToGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToGenre_B_index" ON "_AlbumToGenre"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToArtist_AB_unique" ON "_AlbumToArtist"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToArtist_B_index" ON "_AlbumToArtist"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToExternal_AB_unique" ON "_AlbumToExternal"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToExternal_B_index" ON "_AlbumToExternal"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToServerFolder_AB_unique" ON "_AlbumToServerFolder"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToServerFolder_B_index" ON "_AlbumToServerFolder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToImage_AB_unique" ON "_AlbumToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToImage_B_index" ON "_AlbumToImage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToFavorite_AB_unique" ON "_AlbumToFavorite"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToFavorite_B_index" ON "_AlbumToFavorite"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToGenre_AB_unique" ON "_ArtistToGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToGenre_B_index" ON "_ArtistToGenre"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToSong_AB_unique" ON "_ArtistToSong"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToSong_B_index" ON "_ArtistToSong"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToExternal_AB_unique" ON "_ArtistToExternal"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToExternal_B_index" ON "_ArtistToExternal"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToServerFolder_AB_unique" ON "_ArtistToServerFolder"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToServerFolder_B_index" ON "_ArtistToServerFolder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToImage_AB_unique" ON "_ArtistToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToImage_B_index" ON "_ArtistToImage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToFavorite_AB_unique" ON "_ArtistToFavorite"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToFavorite_B_index" ON "_ArtistToFavorite"("B");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPermissions" ADD CONSTRAINT "ServerPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerPermissions" ADD CONSTRAINT "ServerPermissions_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerUrl" ADD CONSTRAINT "ServerUrl_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerFolder" ADD CONSTRAINT "ServerFolder_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerFolderPermissions" ADD CONSTRAINT "ServerFolderPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerFolderPermissions" ADD CONSTRAINT "ServerFolderPermissions_serverFolderId_fkey" FOREIGN KEY ("serverFolderId") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtistRating" ADD CONSTRAINT "AlbumArtistRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtistRating" ADD CONSTRAINT "AlbumArtistRating_albumArtistId_fkey" FOREIGN KEY ("albumArtistId") REFERENCES "AlbumArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistRating" ADD CONSTRAINT "ArtistRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistRating" ADD CONSTRAINT "ArtistRating_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumRating" ADD CONSTRAINT "AlbumRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumRating" ADD CONSTRAINT "AlbumRating_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRating" ADD CONSTRAINT "SongRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRating" ADD CONSTRAINT "SongRating_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtist" ADD CONSTRAINT "AlbumArtist_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_albumArtistId_fkey" FOREIGN KEY ("albumArtistId") REFERENCES "AlbumArtist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HistoryToSong" ADD CONSTRAINT "_HistoryToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HistoryToSong" ADD CONSTRAINT "_HistoryToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToSong" ADD CONSTRAINT "_FolderToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToSong" ADD CONSTRAINT "_FolderToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToServerFolder" ADD CONSTRAINT "_FolderToServerFolder_A_fkey" FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToServerFolder" ADD CONSTRAINT "_FolderToServerFolder_B_fkey" FOREIGN KEY ("B") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServerFolderToSong" ADD CONSTRAINT "_ServerFolderToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServerFolderToSong" ADD CONSTRAINT "_ServerFolderToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSong" ADD CONSTRAINT "_GenreToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToSong" ADD CONSTRAINT "_GenreToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteToSong" ADD CONSTRAINT "_FavoriteToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "Favorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FavoriteToSong" ADD CONSTRAINT "_FavoriteToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSong" ADD CONSTRAINT "_ImageToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSong" ADD CONSTRAINT "_ImageToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExternalToSong" ADD CONSTRAINT "_ExternalToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "External"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExternalToSong" ADD CONSTRAINT "_ExternalToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToGenre" ADD CONSTRAINT "_AlbumArtistToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToGenre" ADD CONSTRAINT "_AlbumArtistToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToExternal" ADD CONSTRAINT "_AlbumArtistToExternal_A_fkey" FOREIGN KEY ("A") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToExternal" ADD CONSTRAINT "_AlbumArtistToExternal_B_fkey" FOREIGN KEY ("B") REFERENCES "External"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToServerFolder" ADD CONSTRAINT "_AlbumArtistToServerFolder_A_fkey" FOREIGN KEY ("A") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToServerFolder" ADD CONSTRAINT "_AlbumArtistToServerFolder_B_fkey" FOREIGN KEY ("B") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToImage" ADD CONSTRAINT "_AlbumArtistToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToImage" ADD CONSTRAINT "_AlbumArtistToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToFavorite" ADD CONSTRAINT "_AlbumArtistToFavorite_A_fkey" FOREIGN KEY ("A") REFERENCES "AlbumArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumArtistToFavorite" ADD CONSTRAINT "_AlbumArtistToFavorite_B_fkey" FOREIGN KEY ("B") REFERENCES "Favorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGenre" ADD CONSTRAINT "_AlbumToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGenre" ADD CONSTRAINT "_AlbumToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToArtist" ADD CONSTRAINT "_AlbumToArtist_B_fkey" FOREIGN KEY ("B") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToExternal" ADD CONSTRAINT "_AlbumToExternal_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToExternal" ADD CONSTRAINT "_AlbumToExternal_B_fkey" FOREIGN KEY ("B") REFERENCES "External"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToServerFolder" ADD CONSTRAINT "_AlbumToServerFolder_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToServerFolder" ADD CONSTRAINT "_AlbumToServerFolder_B_fkey" FOREIGN KEY ("B") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToImage" ADD CONSTRAINT "_AlbumToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToImage" ADD CONSTRAINT "_AlbumToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToFavorite" ADD CONSTRAINT "_AlbumToFavorite_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToFavorite" ADD CONSTRAINT "_AlbumToFavorite_B_fkey" FOREIGN KEY ("B") REFERENCES "Favorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToGenre" ADD CONSTRAINT "_ArtistToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToGenre" ADD CONSTRAINT "_ArtistToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToSong" ADD CONSTRAINT "_ArtistToSong_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToSong" ADD CONSTRAINT "_ArtistToSong_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToExternal" ADD CONSTRAINT "_ArtistToExternal_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToExternal" ADD CONSTRAINT "_ArtistToExternal_B_fkey" FOREIGN KEY ("B") REFERENCES "External"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToServerFolder" ADD CONSTRAINT "_ArtistToServerFolder_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToServerFolder" ADD CONSTRAINT "_ArtistToServerFolder_B_fkey" FOREIGN KEY ("B") REFERENCES "ServerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToImage" ADD CONSTRAINT "_ArtistToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToImage" ADD CONSTRAINT "_ArtistToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToFavorite" ADD CONSTRAINT "_ArtistToFavorite_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToFavorite" ADD CONSTRAINT "_ArtistToFavorite_B_fkey" FOREIGN KEY ("B") REFERENCES "Favorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
