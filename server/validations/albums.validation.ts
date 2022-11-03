import { z } from 'zod';
import { AlbumSort } from '@helpers/albums.helpers';
import {
  idValidation,
  orderByValidation,
  paginationValidation,
  serverFolderIdValidation,
  serverUrlIdValidation,
} from './shared.validation';

const list = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({
    ...paginationValidation,
    ...serverFolderIdValidation,
    ...orderByValidation,
    ...serverUrlIdValidation,
    advancedFilters: z.optional(z.string()),
    sortBy: z.nativeEnum(AlbumSort),
  }),
};

const detail = {
  body: z.object({}),
  params: z.object({
    ...idValidation('albumId'),
    ...idValidation('serverId'),
  }),
  query: z.object({
    ...serverUrlIdValidation,
  }),
};

const detailSongList = {
  body: z.object({}),
  params: z.object({
    ...idValidation('albumId'),
    ...idValidation('serverId'),
  }),
  query: z.object({
    ...paginationValidation,
    ...serverFolderIdValidation,
    ...orderByValidation,
    ...serverUrlIdValidation,
    sortBy: z.nativeEnum(AlbumSort),
  }),
};

export const albumsValidation = {
  detail,
  detailSongList,
  list,
};
