import { z } from 'zod';
import {
  idValidation,
  paginationValidation,
  serverFolderIdValidation,
} from './shared.validation';

const list = {
  body: z.object({}),
  params: z.object(idValidation),
  query: z.object({
    ...paginationValidation,
    ...serverFolderIdValidation,
    albumIds: z.optional(z.string()),
    artistIds: z.optional(z.string()),
    songIds: z.optional(z.string()),
  }),
};

export const songsValidation = {
  list,
};
