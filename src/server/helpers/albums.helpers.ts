import { Prisma } from '@prisma/client';
import { SortOrder } from '../types/types';
import { splitNumberString } from '../utils';
import { songHelpers } from './songs.helpers';

export enum AlbumSort {
  DATE_ADDED = 'date_added',
  DATE_ADDED_REMOTE = 'date_added_remote',
  DATE_PLAYED = 'date_played',
  DATE_RELEASED = 'date_released',
  RANDOM = 'random',
  RATING = 'rating',
  TITLE = 'title',
  YEAR = 'year',
}

const include = (options?: { serverUrls?: string; songs: boolean }) => {
  const props: Prisma.AlbumInclude = {
    _count: { select: { favorites: true, songs: true } },
    albumArtist: true,
    genres: true,
    images: true,
    ratings: true,
    server: {
      include: {
        serverUrls: options?.serverUrls
          ? { where: { id: { in: splitNumberString(options.serverUrls) } } }
          : true,
      },
    },

    songs: options?.songs ? songHelpers.include() : false,
  };

  return props;
};

const sort = (sortBy: AlbumSort, orderBy: SortOrder) => {
  let order;

  switch (sortBy) {
    case AlbumSort.TITLE:
      order = { name: orderBy };
      break;

    case AlbumSort.DATE_ADDED:
      order = { createdAt: orderBy };
      break;

    case AlbumSort.DATE_ADDED_REMOTE:
      order = { remoteCreatedAt: orderBy };
      break;

    case AlbumSort.DATE_RELEASED:
      order = { date: orderBy, year: orderBy };
      break;

    case AlbumSort.YEAR:
      order = { year: orderBy };
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
