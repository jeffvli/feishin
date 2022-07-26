import { Prisma } from '@prisma/client';

const include = () => {
  const body = {
    include: {
      album: true,
      artists: true,
      externals: true,
      genres: true,
      images: true,
    },
    orderBy: [{ disc: Prisma.SortOrder.asc }, { track: Prisma.SortOrder.asc }],
  };

  return body;
};

export const songHelpers = {
  include,
};
