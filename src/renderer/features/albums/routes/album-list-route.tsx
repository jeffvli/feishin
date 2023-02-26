import { VirtualInfiniteGridRef } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumListFilters, useCurrentServer } from '/@/renderer/store';
import { useSearchParams } from 'react-router-dom';
import { AlbumListQuery, ServerType } from '/@/renderer/api/types';

const AlbumListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);
  const filters = useAlbumListFilters();
  const server = useCurrentServer();

  const [searchParams] = useSearchParams();

  const customFilters: Partial<AlbumListQuery> | undefined = searchParams.get('artistId')
    ? {
        jfParams:
          server?.type === ServerType.JELLYFIN
            ? {
                artistIds: searchParams.get('artistId') as string,
              }
            : undefined,
        ndParams:
          server?.type === ServerType.NAVIDROME
            ? {
                artist_id: searchParams.get('artistId') as string,
              }
            : undefined,
      }
    : undefined;

  const itemCountCheck = useAlbumList(
    {
      limit: 1,
      startIndex: 0,
      ...filters,
      ...customFilters,
      jfParams: {
        ...filters.jfParams,
        ...customFilters?.jfParams,
      },
      ndParams: {
        ...filters.ndParams,
        ...customFilters?.ndParams,
      },
    },
    {
      cacheTime: 1000 * 60 * 60 * 2,
      staleTime: 1000 * 60 * 60 * 2,
    },
  );

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  return (
    <AnimatedPage>
      <AlbumListHeader
        customFilters={customFilters}
        gridRef={gridRef}
        itemCount={itemCount}
        tableRef={tableRef}
        title={searchParams.get('artistName') || undefined}
      />
      <AlbumListContent
        customFilters={customFilters}
        gridRef={gridRef}
        itemCount={itemCount}
        tableRef={tableRef}
      />
    </AnimatedPage>
  );
};

export default AlbumListRoute;
