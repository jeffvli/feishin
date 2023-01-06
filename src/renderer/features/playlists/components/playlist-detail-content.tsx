import { CellContextMenuEvent, ColDef } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group } from '@mantine/core';
import { sortBy } from 'lodash';
import { MutableRefObject, useMemo } from 'react';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, getColumnDefs, Text, VirtualTable } from '/@/renderer/components';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlaylistSongListInfinite } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useSongListStore } from '/@/renderer/store';
import { LibraryItem } from '/@/renderer/types';

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1920px;
  padding: 1rem 2rem 5rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%);
  }

  .ag-header-container {
    z-index: 1000;
  }
`;

interface PlaylistDetailContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailContent = ({ tableRef }: PlaylistDetailContentProps) => {
  const { playlistId } = useParams() as { playlistId: string };
  const page = useSongListStore();

  const playlistSongsQueryInfinite = usePlaylistSongListInfinite(
    {
      id: playlistId,
      limit: 50,
      startIndex: 0,
    },
    { keepPreviousData: false },
  );

  const handleLoadMore = () => {
    playlistSongsQueryInfinite.fetchNextPage();
  };

  const columnDefs: ColDef[] = useMemo(
    () =>
      getColumnDefs(page.table.columns).filter((c) => c.colId !== 'album' && c.colId !== 'artist'),
    [page.table.columns],
  );

  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  const handleContextMenu = (e: CellContextMenuEvent) => {
    if (!e.event) return;
    const clickEvent = e.event as MouseEvent;
    clickEvent.preventDefault();

    const selectedNodes = e.api.getSelectedNodes();
    const selectedIds = selectedNodes.map((node) => node.data.id);
    let selectedRows = sortBy(selectedNodes, ['rowIndex']).map((node) => node.data);

    if (!selectedIds.includes(e.data.id)) {
      e.api.deselectAll();
      e.node.setSelected(true);
      selectedRows = [e.data];
    }

    openContextMenu({
      data: selectedRows,
      menuItems: SONG_CONTEXT_MENU_ITEMS,
      type: LibraryItem.SONG,
      xPos: clickEvent.clientX,
      yPos: clickEvent.clientY,
    });
  };

  const playlistSongData = useMemo(
    () => playlistSongsQueryInfinite.data?.pages.flatMap((p) => p.items),
    [playlistSongsQueryInfinite.data?.pages],
  );

  return (
    <ContentContainer>
      <VirtualTable
        ref={tableRef}
        animateRows
        detailRowAutoHeight
        maintainColumnOrder
        suppressCellFocus
        suppressCopyRowsToClipboard
        suppressLoadingOverlay
        suppressMoveWhenRowDragging
        suppressPaginationPanel
        suppressRowDrag
        suppressScrollOnNewData
        columnDefs={columnDefs}
        defaultColDef={defaultColumnDefs}
        enableCellChangeFlash={false}
        getRowId={(data) => data.data.uniqueId}
        rowData={playlistSongData}
        rowHeight={60}
        rowSelection="multiple"
        onCellContextMenu={handleContextMenu}
        onGridReady={(params) => {
          params.api.setDomLayout('autoHeight');
          params.api.sizeColumnsToFit();
        }}
        onGridSizeChanged={(params) => {
          params.api.sizeColumnsToFit();
        }}
      />
      <Group
        p="2rem"
        position="center"
      >
        <Button
          compact
          disabled={!playlistSongsQueryInfinite.hasNextPage}
          loading={playlistSongsQueryInfinite.isFetchingNextPage}
          variant="subtle"
          onClick={handleLoadMore}
        >
          Load more
        </Button>
        <Text>or</Text>
        <Button
          compact
          component={Link}
          to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId })}
          variant="subtle"
        >
          View full playlist
        </Button>
      </Group>
    </ContentContainer>
  );
};
