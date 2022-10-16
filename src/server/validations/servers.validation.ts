import { ServerType } from '@prisma/client';
import { z } from 'zod';
import { idValidation } from './shared.validation';

const detail = {
  body: z.object({}),
  params: z.object(idValidation),
  query: z.object({}),
};

const create = {
  body: z.object({
    legacy: z.boolean().optional(),
    name: z.string(),
    password: z.string(),
    type: z.enum([
      ServerType.JELLYFIN,
      ServerType.SUBSONIC,
      ServerType.NAVIDROME,
    ]),
    url: z.string(),
    username: z.string(),
  }),
  params: z.object({}),
  query: z.object({}),
};

const scan = {
  body: z.object({ serverFolderId: z.string().array().optional() }),
  params: z.object(idValidation),
  query: z.object({}),
};

const refresh = {
  body: z.object({}),
  params: z.object(idValidation),
  query: z.object({}),
};

export const serversValidation = {
  create,
  detail,
  refresh,
  scan,
};
