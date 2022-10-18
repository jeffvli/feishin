import { ServerType } from '@prisma/client';
import { z } from 'zod';
import { idValidation } from './shared.validation';

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('id') }),
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
  params: z.object({ ...idValidation('id') }),
  query: z.object({}),
};

const refresh = {
  body: z.object({}),
  params: z.object({ ...idValidation('id') }),
  query: z.object({}),
};

const createCredential = {
  body: z.object({ credential: z.string() }),
  params: z.object({ ...idValidation('id') }),
  query: z.object({}),
};

export const serversValidation = {
  create,
  createCredential,
  detail,
  refresh,
  scan,
};
