import { User } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../lib';
import { OffsetPagination } from '../types/types';
import { ApiError, folderPermissions } from '../utils';

const findById = async (options: { id: string; user: User }) => {
  const { id, user } = options;

  const artist = await prisma.artist.findUnique({
    include: { genres: true, serverFolders: true },
    where: { id },
  });

  if (!artist) throw ApiError.notFound('');

  const serverFolderIds = artist.serverFolders.map(
    (serverFolder) => serverFolder.id
  );

  if (!(await folderPermissions(serverFolderIds, user)))
    throw ApiError.forbidden('');

  return artist;
};

const findMany = async (
  req: Request,
  options: { serverFolderIds: string; user: User } & OffsetPagination
) => {
  const { user, skip, take, serverFolderIds: rServerFolderIds } = options;
  const serverFolderIds = rServerFolderIds.split(',');

  if (!(await folderPermissions(serverFolderIds!, user)))
    throw ApiError.forbidden('');

  const serverFoldersFilter = serverFolderIds!.map((serverFolderId) => ({
    serverFolders: { some: { id: { equals: serverFolderId } } },
  }));

  const [totalEntries, artists] = await prisma.$transaction([
    prisma.artist.count({
      where: { OR: serverFoldersFilter },
    }),
    prisma.artist.findMany({
      include: { genres: true },
      skip,
      take,
      where: { OR: serverFoldersFilter },
    }),
  ]);

  return { data: artists, totalEntries };
};

export const artistsService = {
  findById,
  findMany,
};
