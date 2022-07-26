import { Request } from 'express';
import { prisma } from '../lib';
import { OffsetPagination, User } from '../types/types';
import {
  ApiError,
  ApiSuccess,
  folderPermissions,
  splitNumberString,
} from '../utils';
import { toRes } from './response';
import { SongRequestParams } from './types';

const findById = async (options: { id: number; user: User }) => {
  const { id, user } = options;

  const album = await prisma.album.findUnique({
    include: {
      _count: true,
      albumArtist: true,
      genres: true,
      songs: {
        include: {
          album: true,
          artists: true,
          externals: true,
          genres: true,
          images: true,
        },
        orderBy: [{ disc: 'asc' }, { track: 'asc' }],
      },
    },
    where: { id },
  });

  if (!album) {
    throw ApiError.notFound('');
  }

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
    artistIds: rawArtistIds,
    songIds: rawSongIds,
    user,
    limit,
    page,
    serverFolderIds: rServerFolderIds,
  } = options;
  const serverFolderIds = splitNumberString(rServerFolderIds);
  const albumIds = splitNumberString(rawAlbumIds);
  const artistIds = splitNumberString(rawArtistIds);
  const songIds = splitNumberString(rawSongIds);

  if (serverFolderIds) {
    if (!(await folderPermissions(serverFolderIds, user))) {
      throw ApiError.forbidden('');
    }
  }

  // const serverFoldersFilter = serverFolderIds!.map((serverFolderId: number) => {
  //   return { serverFolders: { id: { equals: serverFolderId } } };
  // });

  const serverFoldersFilter = {
    serverFolders: { some: { id: { in: serverFolderIds } } },
  };

  const startIndex = limit * page;

  const [totalEntries, songs] = await prisma.$transaction([
    prisma.song.count({
      where: {
        OR: [
          serverFoldersFilter,
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
      skip: startIndex,
      take: limit,
      where: { OR: serverFoldersFilter },
    }),
  ]);

  return ApiSuccess.ok({
    data: songs,
    paginationItems: {
      limit,
      page,
      startIndex,
      totalEntries,
      url: req.originalUrl,
    },
  });
};

export const songsService = {
  findById,
  findMany,
};
