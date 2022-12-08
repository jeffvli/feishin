import { useAuthStore } from '../store/auth.store';
import { navidromeApi } from './navidrome.api';
import type {
  AlbumDetailQuery,
  AlbumDetailResponse,
  AlbumListParams,
  AlbumListResponse,
} from './types';

export const getServerType = () => {
  const server = useAuthStore.getState().currentServer;

  if (!server) {
    return null;
  }

  return server.type;
};

const getAlbumDetail = async (
  query: AlbumDetailQuery,
  signal?: AbortSignal,
): Promise<AlbumDetailResponse> => {
  const serverType = getServerType();
  if (!serverType) return null;

  const functions = {
    jellyfin: null,
    navidrome: navidromeApi.getAlbumDetail,
    subsonic: null,
  };

  if (functions[serverType] === null) {
    return null;
  }

  return functions[serverType]?.(query, signal);
};

const getAlbumList = async (
  params: AlbumListParams,
  signal?: AbortSignal,
): Promise<AlbumListResponse> => {
  const serverType = getServerType();
  if (!serverType) return null;

  const functions = {
    jellyfin: null,
    navidrome: navidromeApi.getAlbumList,
    subsonic: null,
  };

  if (functions[serverType] === null) {
    return null;
  }

  return functions[serverType]?.(params, signal);
};

export const apiController = {
  getAlbumDetail,
  getAlbumList,
};
