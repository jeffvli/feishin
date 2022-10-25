import { AuthUser } from '@/middleware';
import { OffsetPagination, SortOrder } from '@/types/types';
import { ApiError } from '@/utils';
import { AlbumSort } from '@helpers/albums.helpers';
import { helpers } from '@helpers/index';
import { prisma } from '@lib/prisma';

const findById = async (user: AuthUser, options: { id: string }) => {
  const { id } = options;

  const album = await prisma.album.findUnique({
    include: helpers.albums.include({ songs: true }),
    where: { id },
  });

  if (!album) {
    throw ApiError.notFound('');
  }

  const serverFolderId = album.serverFolders.map((s) => s.id);
  helpers.shared.checkServerFolderPermissions(user, { serverFolderId });

  return album;
};

export type AlbumFindManyOptions = {
  orderBy: SortOrder;
  serverFolderId?: string[];
  serverId: string;
  sortBy: AlbumSort;
  user: AuthUser;
} & OffsetPagination;

const findMany = async (options: AlbumFindManyOptions) => {
  const { take, serverFolderId, skip, sortBy, orderBy, user, serverId } =
    options;

  const serverFolderIds =
    serverFolderId ||
    (await helpers.shared.getAvailableServerFolderIds(user, { serverId }));

  let totalEntries = 0;
  let albums;

  if (sortBy === AlbumSort.RATING) {
    const [count, result] = await prisma.$transaction([
      prisma.albumRating.count({
        where: {
          album: { OR: helpers.shared.serverFolderFilter(serverFolderIds) },
          user: { id: user.id },
        },
      }),
      prisma.albumRating.findMany({
        include: {
          album: {
            include: helpers.albums.include({ songs: false, user }),
          },
        },
        orderBy: { value: orderBy },
        skip,
        take,
        where: {
          album: { OR: helpers.shared.serverFolderFilter(serverFolderIds) },
          user: { id: user.id },
        },
      }),
    ]);
    albums = result.map((rating) => rating.album);
    totalEntries = count;
  } else if (sortBy === AlbumSort.FAVORITE) {
    [totalEntries, albums] = await prisma.$transaction([
      prisma.album.count({
        where: {
          AND: [
            helpers.shared.serverFolderFilter(serverFolderIds),
            { favorites: { some: { userId: user.id } } },
          ],
        },
      }),
      prisma.album.findMany({
        include: helpers.albums.include({ songs: false, user }),
        skip,
        take,
        where: {
          AND: [
            helpers.shared.serverFolderFilter(serverFolderIds),
            { favorites: { some: { userId: user.id } } },
          ],
        },
      }),
    ]);
  } else {
    [totalEntries, albums] = await prisma.$transaction([
      prisma.album.count({
        where: { OR: helpers.shared.serverFolderFilter(serverFolderIds) },
      }),
      prisma.album.findMany({
        include: helpers.albums.include({ songs: false, user }),
        orderBy: [helpers.albums.sort(sortBy, orderBy)],
        skip,
        take,
        where: { OR: helpers.shared.serverFolderFilter(serverFolderIds) },
      }),
    ]);
  }

  return { data: albums, totalEntries };
};

export const albumsService = {
  findById,
  findMany,
};
