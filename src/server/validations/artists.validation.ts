import { z } from 'zod';
import { AlbumSort } from '../helpers/albums.helpers';
import {
  idValidation,
  orderByValidation,
  paginationValidation,
  serverFolderIdValidation,
} from './shared.validation';

const list = {
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    ...paginationValidation,
    ...serverFolderIdValidation,
    ...orderByValidation,
    sortBy: z.nativeEnum(AlbumSort),
  }),
};

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('id') }),
  query: z.object({}),
};

export const artistsValidation = {
  detail,
  list,
};
