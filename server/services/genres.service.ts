import { prisma } from '@lib/prisma';
import { ApiError } from '@utils/api-error';

const findManyByServer = async (options: { serverId: string }) => {
  const { serverId } = options;

  const genres = await prisma.genre.findMany({
    include: {
      _count: {
        select: {
          albumArtists: { where: { serverId } },
          albums: { where: { serverId } },
          artists: { where: { serverId } },
          songs: { where: { serverId } },
        },
      },
    },
    where: {
      OR: [
        { albumArtists: { some: { serverId } } },
        { albums: { some: { serverId } } },
        { artists: { some: { serverId } } },
        { songs: { some: { serverId } } },
      ],
    },
  });

  if (!genres) {
    throw ApiError.notFound('');
  }

  return genres;
};

const findMany = async () => {
  const genres = await prisma.genre.findMany({
    include: {
      _count: {
        select: {
          albumArtists: true,
          albums: true,
          artists: true,
          songs: true,
        },
      },
    },
  });

  if (!genres) {
    throw ApiError.notFound('');
  }

  return genres;
};

export const genresService = {
  findMany,
  findManyByServer,
};
