import { AuthUser } from '@/middleware';
import { SortOrder } from '@/types/types';
import { songHelpers } from '@helpers/songs.helpers';

export enum AlbumSort {
  DATE_ADDED = 'added',
  DATE_ADDED_REMOTE = 'addedRemote',
  DATE_RELEASED = 'released',
  DATE_RELEASED_YEAR = 'year',
  FAVORITE = 'favorite',
  NAME = 'name',
  RANDOM = 'random',
  RATING = 'rating',
}

const include = (options: { songs?: boolean; user?: AuthUser }) => {
  // Prisma.AlbumInclude
  const props = {
    _count: {
      select: {
        favorites: true,
        songs: true,
      },
    },
    albumArtists: true,
    artists: true,
    favorites: { where: { userId: options.user?.id } },
    genres: true,
    images: true,
    ratings: {
      where: {
        userId: options.user?.id,
      },
    },
    server: true,
    serverFolders: true,
    songs: options?.songs && songHelpers.findMany(),
  };

  return props;
};

const sort = (sortBy: AlbumSort, orderBy: SortOrder) => {
  let order;

  switch (sortBy) {
    case AlbumSort.NAME:
      order = { name: orderBy };
      break;

    case AlbumSort.DATE_ADDED:
      order = { createdAt: orderBy };
      break;

    case AlbumSort.DATE_ADDED_REMOTE:
      order = { remoteCreatedAt: orderBy };
      break;

    case AlbumSort.DATE_RELEASED:
      order = { releaseDate: orderBy, year: orderBy };
      break;

    case AlbumSort.DATE_RELEASED_YEAR:
      order = { releaseYear: orderBy };
      break;

    case AlbumSort.RATING:
      order = { rating: orderBy };
      break;

    case AlbumSort.FAVORITE:
      order = { favorite: orderBy };
      break;

    default:
      order = { title: orderBy };
      break;
  }

  return order;
};

export const albumHelpers = {
  include,
  sort,
};
