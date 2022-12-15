import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '/@/api';
import { ndNormalize } from '/@/api/navidrome.api';
import type { NDAlbum } from '/@/api/navidrome.types';
import { queryKeys } from '/@/api/query-keys';
import type { AlbumListQuery, RawAlbumListResponse } from '/@/api/types';
import { AlbumListSort, SortOrder } from '/@/api/types';
import type { QueryOptions } from '/@/lib/react-query';
import { useCurrentServer } from '/@/store';

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
