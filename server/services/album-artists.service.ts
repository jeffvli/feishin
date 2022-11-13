import { Request } from 'express';
import { OffsetPagination } from '@/types/types';
import { ApiError } from '@/utils';
import { prisma } from '@lib/prisma';
import { AuthUser } from '@middleware/authenticate';
import { folderPermissions } from '@utils/folder-permissions';

const findById = async (options: { id: string; user: AuthUser }) => {
  const { id, user } = options;
  const albumArtist = await prisma.albumArtist.findUnique({
    include: {
      albums: { include: { songs: true } },
      genres: true,
      images: true,
      serverFolders: true,
    },
    where: { id },
  });

  if (!albumArtist) {
    throw ApiError.notFound('');
  }

  const serverFolderIds = albumArtist.serverFolders.map(
    (serverFolder) => serverFolder.id
  );

  if (!(await folderPermissions(serverFolderIds, user))) {
    throw ApiError.forbidden('');
  }

  return albumArtist;
};

const findMany = async (
  req: Request,
  options: { serverFolderIds: string; user: AuthUser } & OffsetPagination
) => {
  const { user, take, serverFolderIds: rServerFolderIds, skip } = options;
  const serverFolderIds = rServerFolderIds.split(',');

  if (!(await folderPermissions(serverFolderIds!, user))) {
    throw ApiError.forbidden('');
  }

  const serverFoldersFilter = serverFolderIds!.map((serverFolderId) => ({
    serverFolders: { some: { id: { equals: serverFolderId } } },
  }));

  const [totalEntries, albumArtists] = await prisma.$transaction([
    prisma.albumArtist.count({
      where: { OR: serverFoldersFilter },
    }),
    prisma.albumArtist.findMany({
      include: { genres: true },
      skip,
      take,
      where: { OR: serverFoldersFilter },
    }),
  ]);

  return { data: albumArtists, totalEntries };
};

export const albumArtistsService = {
  findById,
  findMany,
};
