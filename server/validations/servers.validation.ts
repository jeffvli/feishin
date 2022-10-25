import { ServerType } from '@prisma/client';
import { z } from 'zod';
import { idValidation } from './shared.validation';

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const list = {
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
};

const deleteServer = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const update = {
  body: z.object({
    legacy: z.boolean().optional(),
    name: z.string().optional(),
    password: z.string().optional(),
    type: z.nativeEnum(ServerType),
    url: z.string().optional(),
    username: z.string().optional(),
  }),
  params: z.object({ ...idValidation('serverId') }),
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
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const refresh = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const createCredential = {
  body: z.object({ credential: z.string(), username: z.string() }),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const getCredentialDetail = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const deleteCredential = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('credentialId'),
  }),
  query: z.object({}),
};

const enableCredential = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('credentialId'),
  }),
  query: z.object({}),
};

const disableCredential = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('credentialId'),
  }),
  query: z.object({}),
};

const createUrl = {
  body: z.object({ url: z.string() }),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

const deleteUrl = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('urlId'),
  }),
  query: z.object({}),
};

const enableUrl = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('urlId'),
  }),
  query: z.object({}),
};

const disableUrl = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('urlId'),
  }),
  query: z.object({}),
};

export const serversValidation = {
  create,
  createCredential,
  createUrl,
  deleteCredential,
  deleteServer,
  deleteUrl,
  detail,
  disableCredential,
  disableUrl,
  enableCredential,
  enableUrl,
  getCredentialDetail,
  list,
  refresh,
  scan,
  update,
};
