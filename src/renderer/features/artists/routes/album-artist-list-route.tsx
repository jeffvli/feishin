import { VirtualGridContainer, VirtualInfiniteGridRef } from '/@/renderer/components';
import { AlbumArtistListHeader } from '/@/renderer/features/artists/components/album-artist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { AlbumArtistListContent } from '/@/renderer/features/artists/components/album-artist-list-content';

const AlbumArtistListRoute = () => {
  const gridRef = useRef<VirtualInfiniteGridRef | null>(null);
  const tableRef = useRef<AgGridReactType | null>(null);

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumArtistListHeader
          gridRef={gridRef}
          tableRef={tableRef}
        />
        <AlbumArtistListContent
          gridRef={gridRef}
          tableRef={tableRef}
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumArtistListRoute;
