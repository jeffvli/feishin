import { VirtualInfiniteGridRef } from '/@/renderer/components';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { useAlbumArtistListStore } from '/@/renderer/store';

const AlbumArtistListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);
  const page = useAlbumArtistListStore();
  const filters = page.filter;

  const itemCountCheck = useAlbumArtistList(
    {
      limit: 1,
      startIndex: 0,
      ...filters,
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
      <AlbumArtistListHeader
        gridRef={gridRef}
        itemCount={itemCount}
        tableRef={tableRef}
      />
      <AlbumArtistListContent
        gridRef={gridRef}
        tableRef={tableRef}
      />
    </AnimatedPage>
  );
};

export default AlbumArtistListRoute;
