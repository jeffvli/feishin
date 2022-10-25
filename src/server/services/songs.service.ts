import { User } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../lib';
import { SortOrder } from '../types/types';
import { ApiError, ApiSuccess, folderPermissions } from '../utils';
// import { toRes } from './response';
import { SongRequestParams } from './types';

const findById = async (options: { id: string; user: User }) => {
  const { id } = options;

  const album = await prisma.album.findUnique({
    include: {
      _count: true,
      albumArtists: true,
      genres: true,
      songs: {
        include: {
          album: true,
          artists: true,
          externals: true,
          genres: true,
          images: true,
        },
        orderBy: [
          { discNumber: SortOrder.ASC },
          { trackNumber: SortOrder.ASC },
        ],
      },
    },
    where: { id },
  });

  if (!album) throw ApiError.notFound('');

  // if (!(await folderPermissions([album?.serverFolderId], user))) {
  //   throw ApiError.forbidden('');
  // }

  return ApiSuccess.ok({ data: album });
};

const findMany = async (
  req: Request,
  options: SongRequestParams & { user: User }
) => {
  const {
    albumIds: rawAlbumIds,
    // artistIds: rawArtistIds,
    serverId,
    songIds: rawSongIds,
    user,
    skip,
    take,
    serverFolderIds: rServerFolderIds,
  } = options;
  const serverFolderIds = rServerFolderIds.split(',');
  const albumIds = rawAlbumIds && rawAlbumIds.split(',');
  // const artistIds = rawArtistIds && rawArtistIds.split(',');
  const songIds = rawSongIds && rawSongIds.split(',');

  if (serverFolderIds) {
    if (!(await folderPermissions(serverFolderIds, user)))
      throw ApiError.forbidden('');
  }

  // const serverFoldersFilter = serverFolderIds!.map((serverFolderId: number) => {
  //   return { serverFolders: { id: { equals: serverFolderId } } };
  // });

  // const serverFoldersFilter = {
  //   serverFolders: { some: { id: { in: serverFolderIds } } },
  // };

  const [totalEntries, songs] = await prisma.$transaction([
    prisma.song.count({
      where: {
        OR: [
          // serverFoldersFilter,
          {
            albumId: { in: albumIds },
            id: { in: songIds },
          },
        ],
      },
    }),
    prisma.song.findMany({
      include: {
        _count: { select: { favorites: true } },
        genres: true,
        images: true,
        serverFolders: { include: { server: true } },
      },
      skip,
      take,
      where: {
        AND: {
          // OR: serverFoldersFilter,
          serverId,
        },
      },
    }),
  ]);

  return { data: songs, totalEntries };
};

export const songsService = {
  findById,
  findMany,
};
