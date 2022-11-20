import { ax } from '@/renderer/lib/axios';
import { AlbumSort, SortOrder } from '@/renderer/types';
import {
  AlbumDetailResponse,
  AlbumListResponse,
  PaginationParams,
} from './types';

const getAlbumDetail = async (
  query: { albumId: string; serverId: string },
  signal?: AbortSignal
) => {
  const { data } = await ax.get<AlbumDetailResponse>(
    `/servers/${query.serverId}/albums/${query.albumId}`,
    { signal }
  );

  // const songs = data.data.songs?.map((s) => ({
  //   ...s,
  //   streamUrl:
  // }));

  return data;
};

export type AlbumListParams = PaginationParams & {
  advancedFilters?: string;
  orderBy: SortOrder;
  serverFolderId?: string[];
  serverUrlId?: string;
  sortBy: AlbumSort;
};

const getAlbumList = async (
  query: { serverId: string },
  params: AlbumListParams,
  signal?: AbortSignal
) => {
  const { data } = await ax.get<AlbumListResponse>(
    `/servers/${query.serverId}/albums`,
    {
      params,
      signal,
    }
  );
  return data;
};

export const albumsApi = {
  getAlbumDetail,
  getAlbumList,
};
