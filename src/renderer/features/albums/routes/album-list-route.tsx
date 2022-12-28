import { VirtualGridContainer, VirtualInfiniteGridRef } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { AlbumListContent } from '/@/renderer/features/albums/components/album-list-content';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

const AlbumListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumListHeader
          gridRef={gridRef}
          tableRef={tableRef}
        />
        <AlbumListContent
          gridRef={gridRef}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
