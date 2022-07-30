import { Album } from '@prisma/client';
import { Request } from 'express';
import { albumHelpers, AlbumSort } from '../helpers/albums.helpers';
import { sharedHelpers } from '../helpers/shared.helpers';
import { prisma } from '../lib';
import { OffsetPagination, SortOrder, User } from '../types/types';
import {
  ApiError,
  ApiSuccess,
  folderPermissions,
  getFolderPermissions,
  splitNumberString,
} from '../utils';
import { toRes } from './response';

const findById = async (options: {
  id: number;
  serverUrls?: string;
  user: User;
}) => {
  const { id, user, serverUrls } = options;

  const album = await prisma.album.findUnique({
    include: {
      ...albumHelpers.include({ serverUrls, songs: true }),
      serverFolders: true,
    },
    where: { id },
  });

  if (!album) {
    throw ApiError.notFound('');
  }

  const serverFolderIds = album.serverFolders.map(
    (serverFolder) => serverFolder.id
  );

  if (!(await folderPermissions(serverFolderIds, user))) {
    throw ApiError.forbidden('');
  }

  return ApiSuccess.ok({ data: toRes.albums([album], user)[0] });
};

const findMany = async (
  req: Request,
  options: {
    orderBy: SortOrder;
    serverFolderIds?: string;
    serverUrls?: string;
    sortBy: AlbumSort;
    user: User;
  } & OffsetPagination
) => {
  const {
    user,
    take,
    serverFolderIds: rServerFolderIds,
    serverUrls,
    skip,
    sortBy,
    orderBy,
  } = options;

  const serverFolderIds = rServerFolderIds
    ? splitNumberString(rServerFolderIds)
    : await getFolderPermissions(user);

  if (!(await folderPermissions(serverFolderIds!, user))) {
    throw ApiError.forbidden('');
  }

  const serverFoldersFilter = sharedHelpers.serverFolderFilter(
    serverFolderIds!
  );

  let totalEntries = 0;
  let albums: Album[];

  if (sortBy === AlbumSort.RATING) {
    const [count, result] = await prisma.$transaction([
      prisma.albumRating.count({
        where: {
          album: { OR: serverFoldersFilter },
          user: { id: user.id },
        },
      }),
      prisma.albumRating.findMany({
        include: {
          album: {
            include: { ...albumHelpers.include({ serverUrls, songs: false }) },
          },
        },
        orderBy: { value: orderBy },
        skip,
        take,
        where: {
          album: { OR: serverFoldersFilter },
          user: { id: user.id },
        },
      }),
    ]);

    albums = result.map((rating) => rating.album) as Album[];
    totalEntries = count;
  } else {
    const [count, result] = await prisma.$transaction([
      prisma.album.count({
        where: { OR: serverFoldersFilter },
      }),
      prisma.album.findMany({
        include: { ...albumHelpers.include({ serverUrls, songs: false }) },
        orderBy: [{ ...albumHelpers.sort(sortBy, orderBy) }],
        skip,
        take,
        where: { OR: serverFoldersFilter },
      }),
    ]);

    albums = result;
    totalEntries = count;
  }

  return ApiSuccess.ok({
    data: toRes.albums(albums, user),
    paginationItems: {
      skip,
      take,
      totalEntries,
      url: req.originalUrl,
    },
  });
};

export const albumsService = {
  findById,
  findMany,
};
