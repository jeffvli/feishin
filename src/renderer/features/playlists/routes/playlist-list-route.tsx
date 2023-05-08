import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { PlaylistListSort, SortOrder } from '/@/renderer/api/types';
import { PlaylistListContent } from '/@/renderer/features/playlists/components/playlist-list-content';
import { PlaylistListHeader } from '/@/renderer/features/playlists/components/playlist-list-header';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { AnimatedPage } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';

const PlaylistListRoute = () => {
  const tableRef = useRef<AgGridReactType | null>(null);
  const server = useCurrentServer();

  const itemCountCheck = usePlaylistList({
    options: {
      cacheTime: 1000 * 60 * 60 * 2,
      staleTime: 1000 * 60 * 60 * 2,
    },
    query: {
      limit: 1,
      sortBy: PlaylistListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    serverId: server?.id,
  });

  const itemCount =
    itemCountCheck.data?.totalRecordCount === null
      ? undefined
      : itemCountCheck.data?.totalRecordCount;

  return (
    <AnimatedPage>
      <PlaylistListHeader
        itemCount={itemCount}
        tableRef={tableRef}
      />
      <PlaylistListContent tableRef={tableRef} />
    </AnimatedPage>
  );
};

export default PlaylistListRoute;
