import { api } from 'renderer/lib';
import { AlbumsResponse, BasePaginationRequest } from './types';

export interface AlbumsRequest extends BasePaginationRequest {
  orderBy: string;
  serverFolderIds?: string;
  sortBy: string;
}

const getAlbum = async (params: { id: number }, signal?: AbortSignal) => {
  const { data } = await api.get<AlbumsResponse>(`/albums/${params.id}`, {
    signal,
  });
  return data;
};

const getAlbums = async (params: AlbumsRequest, signal?: AbortSignal) => {
  const { data } = await api.get<AlbumsResponse>(`/albums`, {
    params,
    signal,
  });
  return data;
};

export const albumsApi = {
  getAlbum,
  getAlbums,
};
