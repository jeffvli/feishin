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

  const artist = await prisma.artist.findUnique({
    include: { genres: true, serverFolders: true },
    where: { id },
  });

  if (!artist) {
    throw ApiError.notFound('');
  }

  const serverFolderIds = artist.serverFolders.map(
    (serverFolder) => serverFolder.id
  );

  if (!(await folderPermissions(serverFolderIds, user))) {
    throw ApiError.forbidden('');
  }

  return ApiSuccess.ok({ data: artist });
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
      serverFolders: {
        some: {
          id: { equals: Number(serverFolderId) },
        },
      },
    };
  });

  const startIndex = limit * page;
  const totalEntries = await prisma.artist.count({
    where: { OR: serverFoldersFilter },
  });
  const artists = await prisma.artist.findMany({
    include: { genres: true },
    skip: startIndex,
    take: limit,
    where: { OR: serverFoldersFilter },
  });

  return ApiSuccess.ok({
    data: artists,
    paginationItems: {
      limit,
      page,
      startIndex,
      totalEntries,
      url: req.originalUrl,
    },
  });
};

export const artistsService = {
  findById,
  findMany,
};
