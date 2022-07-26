import { Request } from 'express';
import { prisma } from '../lib';
import { OffsetPagination, User } from '../types/types';
import {
  ApiError,
  ApiSuccess,
  folderPermissions,
  splitNumberString,
} from '../utils';

const findById = async (options: { id: number; user: User }) => {
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

  return ApiSuccess.ok({ data: albumArtist });
};

const findMany = async (
  req: Request,
  options: { serverFolderIds: string; user: User } & OffsetPagination
) => {
  const { user, limit, page, serverFolderIds: rServerFolderIds } = options;
  const serverFolderIds = splitNumberString(rServerFolderIds);

  if (!(await folderPermissions(serverFolderIds!, user))) {
    throw ApiError.forbidden('');
  }

  const serverFoldersFilter = serverFolderIds!.map((serverFolderId: number) => {
    return {
      serverFolders: { some: { id: { equals: Number(serverFolderId) } } },
    };
  });

  const startIndex = limit * page;
  const totalEntries = await prisma.albumArtist.count({
    where: { OR: serverFoldersFilter },
  });
  const albumArtists = await prisma.albumArtist.findMany({
    include: { genres: true },
    skip: startIndex,
    take: limit,
    where: { OR: serverFoldersFilter },
  });

  return ApiSuccess.ok({
    data: albumArtists,
    paginationItems: {
      limit,
      page,
      startIndex,
      totalEntries,
      url: req.originalUrl,
    },
  });
};

export const albumArtistsService = {
  findById,
  findMany,
};
