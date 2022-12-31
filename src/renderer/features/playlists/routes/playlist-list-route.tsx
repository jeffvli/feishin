import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { PlaylistListContent } from '/@/renderer/features/playlists/components/playlist-list-content';
import { PlaylistListHeader } from '/@/renderer/features/playlists/components/playlist-list-header';
import { AnimatedPage } from '/@/renderer/features/shared';

const PlaylistListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);

  return (
    <AnimatedPage>
      <PlaylistListHeader tableRef={tableRef} />
      <PlaylistListContent tableRef={tableRef} />
    </AnimatedPage>
  );
};

export default PlaylistListRoute;
