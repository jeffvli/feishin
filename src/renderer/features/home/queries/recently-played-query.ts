import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import { NDAlbum } from '/@/renderer/api/navidrome.types';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  AlbumListQuery,
  AlbumListSort,
  RawAlbumListResponse,
  SortOrder,
} from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';
import { QueryOptions } from '/@/renderer/lib/react-query';

export const useRecentlyPlayed = (query: Partial<AlbumListQuery>, options?: QueryOptions) => {
  const server = useCurrentServer();

  const requestQuery: AlbumListQuery = {
    limit: 5,
    sortBy: AlbumListSort.RECENTLY_PLAYED,
    sortOrder: SortOrder.ASC,
    startIndex: 0,
    ...query,
  };

  return useQuery({
    queryFn: ({ signal }) =>
      api.controller.getAlbumList({
        query: requestQuery,
        server,
        signal,
      }),
    queryKey: queryKeys.albums.list(server?.id || '', requestQuery),
    select: useCallback(
      (data: RawAlbumListResponse | undefined) => {
        let albums;
        switch (server?.type) {
          case 'jellyfin':
            break;
          case 'navidrome':
            albums = data?.items.map((item) => ndNormalize.album(item as NDAlbum, server));
            break;
          case 'subsonic':
            break;
        }

        return {
          items: albums,
          startIndex: data?.startIndex,
          totalRecordCount: data?.totalRecordCount,
        };
      },
      [server],
    ),
    ...options,
  });
};
