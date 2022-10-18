import { z } from 'zod';
import { paginationValidation, idValidation } from './shared.validation';

export const list = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({
    ...paginationValidation,
    serverFolderIds: z.string().min(1),
  }),
};

export const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('id') }),
  query: z.object({}),
};

export const albumArtistsValidation = {
  detail,
  list,
};
