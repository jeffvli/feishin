import {
  BaseResponse,
  NullResponse,
  Server,
  ServerMap,
  ServerPermissionType,
  ServerType,
  ServerUrl,
} from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type ServerMapResponse = BaseResponse<ServerMap>;

const getServerMap = async (signal?: AbortSignal) => {
  const { data } = await ax.get<ServerMapResponse>('/servers/map', {
    signal,
  });
  return data;
};

export type ServerListResponse = BaseResponse<Server[]>;

const getServerList = async (
  params?: { enabled?: boolean },
  signal?: AbortSignal
) => {
  const { data } = await ax.get<ServerListResponse>('/servers', {
    params,
    signal,
  });
  return data;
};

export type CreateServerBody = {
  legacy?: boolean;
  name: string;
  noCredential?: boolean;
  password: string;
  type: ServerType;
  url: string;
  username: string;
};

export type ServerResponse = BaseResponse<Server>;

const createServer = async (body: CreateServerBody) => {
  const { data } = await ax.post<ServerResponse>('/servers', body);
  return data;
};

const deleteServer = async (options: { query: { serverId: string } }) => {
  const { query } = options;
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}`,
    {}
  );
  return data;
};

const updateServer = async (
  query: { serverId: string },
  body: Partial<CreateServerBody>
) => {
  const { data } = await ax.patch<ServerResponse>(
    `/servers/${query.serverId}`,
    body
  );
  return data;
};

export type CreateUrlBody = {
  url: string;
};

export type UrlResponse = BaseResponse<ServerUrl>;

const createUrl = async (query: { serverId: string }, body: CreateUrlBody) => {
  const { data } = await ax.post<UrlResponse>(
    `/servers/${query.serverId}/url`,
    body
  );
  return data;
};

const deleteUrl = async (query: { serverId: string; urlId: string }) => {
  const { data } = await ax.delete<NullResponse>(
    `/servers/${query.serverId}/url/${query.urlId}`
  );
  return data;
};

const enableUrl = async (query: { serverId: string; urlId: string }) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/url/${query.urlId}/enable`,
    {}
  );
  return data;
};

const disableUrl = async (query: { serverId: string; urlId: string }) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/url/${query.urlId}/disable`,
    {}
  );
  return data;
};

// const deleteFolder = async (query: { serverId: string; folderId: string }) => {
//   const { data } = await ax.delete<NullResponse>(
//     `/servers/${query.serverId}/folder/${query.folderId}`
//   );
//   return data;
// };

const enableFolder = async (query: { folderId: string; serverId: string }) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/folder/${query.folderId}/enable`,
    {}
  );
  return data;
};

const disableFolder = async (query: { folderId: string; serverId: string }) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/folder/${query.folderId}/disable`,
    {}
  );
  return data;
};

export type ScanServerBody = {
  serverFolderId?: string[];
};

const quickScan = async (options: {
  body: ScanServerBody;
  query: { serverId: string };
}) => {
  const { body, query } = options;
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/scan`,
    body
  );
  return data;
};

const fullScan = async (options: {
  body: ScanServerBody;
  query: { serverId: string };
}) => {
  const { body, query } = options;
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/full-scan`,
    body
  );
  return data;
};

export type CreateServerPermissionBody = {
  type: ServerPermissionType;
  userId: string;
};

const createServerPermission = async (
  query: { serverId: string },
  body: CreateServerPermissionBody
) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/permissions`,
    body
  );
  return data;
};

const deleteServerPermission = async (query: {
  permissionId: string;
  serverId: string;
}) => {
  const { data } = await ax.delete<NullResponse>(
    `/servers/${query.serverId}/permissions/${query.permissionId}`
  );

  return data;
};

export type UpdateServerPermissionBody = {
  type: ServerPermissionType;
};

const updateServerPermission = async (
  query: {
    permissionId: string;
    serverId: string;
  },
  body: UpdateServerPermissionBody
) => {
  const { data } = await ax.patch<NullResponse>(
    `/servers/${query.serverId}/permissions/${query.permissionId}`,
    body
  );

  return data;
};

export type CreateServerFolderPermissionBody = {
  userId: string;
};

const createServerFolderPermission = async (
  query: {
    folderId: string;
    serverId: string;
  },
  body: CreateServerFolderPermissionBody
) => {
  const { data } = await ax.post<NullResponse>(
    `/servers/${query.serverId}/folder/${query.folderId}/permissions`,
    body
  );

  return data;
};

const deleteServerFolderPermission = async (query: {
  folderId: string;
  folderPermissionId: string;
  serverId: string;
}) => {
  const { data } = await ax.delete<NullResponse>(
    `/servers/${query.serverId}/folder/${query.folderId}/permissions/${query.folderPermissionId}`
  );

  return data;
};

export const serversApi = {
  createServer,
  createServerFolderPermission,
  createServerPermission,
  createUrl,
  deleteServer,
  deleteServerFolderPermission,
  deleteServerPermission,
  deleteUrl,
  disableFolder,
  disableUrl,
  enableFolder,
  enableUrl,
  fullScan,
  getServerList,
  getServerMap,
  quickScan,
  updateServer,
  updateServerPermission,
};
