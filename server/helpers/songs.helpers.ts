import { Prisma } from '@prisma/client';
import { AuthUser } from '@middleware/authenticate';

const include = () => {
  const props: Prisma.SongInclude = {
    album: true,
    artists: true,
    externals: true,
    genres: true,
    images: true,
    ratings: true,
    server: {
      include: { serverUrls: true },
    },
  };

  return props;
};

const findMany = (user: AuthUser) => {
  const props: Prisma.SongFindManyArgs = {
    include: {
      album: true,
      artists: true,
      externals: true,
      genres: true,
      images: true,
      ratings: true,
      server: {
        include: {
          serverUrls: {
            where: { userServerUrls: { some: { userId: user.id } } },
          },
        },
      },
    },
    orderBy: [
      // { albumId: Prisma.SortOrder.asc },
      { discNumber: Prisma.SortOrder.asc },
      { trackNumber: Prisma.SortOrder.asc },
    ],
  };

  return props;
};

export const songHelpers = {
  findMany,
  include,
};
