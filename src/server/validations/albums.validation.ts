import { z } from 'zod';
import { AlbumSort } from '../helpers/albums.helpers';
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
    sortBy: z.nativeEnum(AlbumSort),
  }),
};

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('id') }),
  query: z.object({
    ...serverUrlIdValidation,
  }),
};

export const albumsValidation = {
  detail,
  list,
};
