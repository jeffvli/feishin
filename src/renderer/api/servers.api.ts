import {
  BaseResponse,
  NullResponse,
  Server,
  ServerType,
  ServerUrl,
} from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type ServerListResponse = BaseResponse<Server[]>;

const getServerList = async (signal?: AbortSignal) => {
  const { data } = await ax.get<ServerListResponse>('/servers', { signal });
  return data;
};

export type CreateServerBody = {
  legacy?: boolean;
  name: string;
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

export const serversApi = {
  createServer,
  createUrl,
  deleteUrl,
  disableUrl,
  enableUrl,
  getServerList,
  updateServer,
};
