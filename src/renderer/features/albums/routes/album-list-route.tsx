import { VirtualGridContainer, VirtualInfiniteGridRef } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useAlbumListFilters } from '/@/renderer/store';

const AlbumListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);
  const filters = useAlbumListFilters();

  const itemCountCheck = useAlbumList(
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
      <VirtualGridContainer>
        <AlbumListHeader
          gridRef={gridRef}
          itemCount={itemCount}
          tableRef={tableRef}
        />
        <AlbumListContent
          gridRef={gridRef}
          itemCount={itemCount}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
