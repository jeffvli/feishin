import { ServerPermissionType, ServerType } from '@prisma/client';
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
  query: z.object({ enabled: z.string().optional() }),
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
    noCredential: z.boolean().optional(),
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
    noCredential: z.boolean().optional(),
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

const deleteFolder = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('folderId'),
  }),
  query: z.object({}),
};

const enableFolder = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('folderId'),
  }),
  query: z.object({}),
};

const disableFolder = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('folderId'),
  }),
  query: z.object({}),
};

const addServerPermission = {
  body: z.object({
    type: z.enum([
      ServerPermissionType.ADMIN,
      ServerPermissionType.VIEWER,
      ServerPermissionType.EDITOR,
    ]),
    userId: z.string().uuid(),
  }),
  params: z.object({
    ...idValidation('serverId'),
  }),
  query: z.object({}),
};

const updateServerPermission = {
  body: z.object({
    type: z.enum([
      ServerPermissionType.ADMIN,
      ServerPermissionType.VIEWER,
      ServerPermissionType.EDITOR,
    ]),
  }),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('permissionId'),
  }),
  query: z.object({}),
};

const deleteServerPermission = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
  }),
  query: z.object({}),
};

const addServerFolderPermission = {
  body: z.object({
    userId: z.string().uuid(),
  }),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('folderId'),
  }),
  query: z.object({}),
};

const deleteServerFolderPermission = {
  body: z.object({}),
  params: z.object({
    ...idValidation('serverId'),
    ...idValidation('folderId'),
    ...idValidation('folderPermissionId'),
  }),
  query: z.object({}),
};

export const serversValidation = {
  addServerFolderPermission,
  addServerPermission,
  create,
  createCredential,
  createUrl,
  deleteCredential,
  deleteFolder,
  deleteServer,
  deleteServerFolderPermission,
  deleteServerPermission,
  deleteUrl,
  detail,
  disableCredential,
  disableFolder,
  disableUrl,
  enableCredential,
  enableFolder,
  enableUrl,
  getCredentialDetail,
  list,
  refresh,
  scan,
  update,
  updateServerPermission,
};
