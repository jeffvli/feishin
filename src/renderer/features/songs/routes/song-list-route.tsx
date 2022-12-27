import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { VirtualGridContainer } from '/@/renderer/components';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';

const TrackListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <SongListHeader tableRef={tableRef} />
        <SongListContent tableRef={tableRef} />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default TrackListRoute;
