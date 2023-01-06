import { MutableRefObject, useCallback, useMemo } from 'react';
import {
  Button,
  DropdownMenu,
  getColumnDefs,
  GridCarousel,
  TextTitle,
  VirtualTable,
} from '/@/renderer/components';
import { CellContextMenuEvent, ColDef } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group, Stack } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import sortBy from 'lodash/sortBy';
import { RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { useParams } from 'react-router';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useSongListStore } from '/@/renderer/store';
import styled from 'styled-components';
import { AppRoute } from '/@/renderer/router/routes';
import { useContainerQuery } from '/@/renderer/hooks';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { Play } from '/@/renderer/types';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { PlayButton, PLAY_TYPES } from '/@/renderer/features/shared';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1920px;
  padding: 1rem 2rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%);
  }

  .ag-header-container {
    z-index: 1000;
  }
`;

interface AlbumDetailContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumDetailContent = ({ tableRef }: AlbumDetailContentProps) => {
  const { albumId } = useParams() as { albumId: string };
  const detailQuery = useAlbumDetail({ id: albumId });
  const cq = useContainerQuery();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const page = useSongListStore();

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

  const [pagination, setPagination] = useSetState({
    artist: 0,
  });

  const handleNextPage = useCallback(
    (key: 'artist') => {
      setPagination({
        [key]: pagination[key as keyof typeof pagination] + 1,
      });
    },
    [pagination, setPagination],
  );

  const handlePreviousPage = useCallback(
    (key: 'artist') => {
      setPagination({
        [key]: pagination[key as keyof typeof pagination] - 1,
      });
    },
    [pagination, setPagination],
  );

  const itemsPerPage = cq.isXl ? 9 : cq.isLg ? 7 : cq.isMd ? 5 : cq.isSm ? 4 : 3;

  const artistQuery = useAlbumList(
    {
      jfParams: {
        albumArtistIds: detailQuery?.data?.albumArtists[0]?.id,
      },
      limit: itemsPerPage,
      ndParams: {
        artist_id: detailQuery?.data?.albumArtists[0]?.id,
      },
      sortBy: AlbumListSort.YEAR,
      sortOrder: SortOrder.DESC,
      startIndex: pagination.artist * itemsPerPage,
    },
    {
      cacheTime: 1000 * 60,
      enabled: detailQuery?.data?.albumArtists[0]?.id !== undefined,
      keepPreviousData: true,
      staleTime: 1000 * 60,
    },
  );

  const carousels = [
    {
      data: artistQuery?.data?.items,
      loading: artistQuery?.isLoading || artistQuery.isFetching,
      pagination: {
        handleNextPage: () => handleNextPage('artist'),
        handlePreviousPage: () => handlePreviousPage('artist'),
        hasPreviousPage: pagination.artist > 0,
        itemsPerPage,
      },
      title: (
        <TextTitle
          fw="bold"
          order={3}
        >
          More from this artist
        </TextTitle>
      ),
      uniqueId: 'mostPlayed',
    },
  ];

  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlay = async (playType?: Play) => {
    handlePlayQueueAdd?.({
      byData: detailQuery?.data?.songs,
      play: playType || playButtonBehavior,
    });
  };

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

  return (
    <ContentContainer>
      <Group
        pb="2rem"
        pt="1rem"
        spacing="lg"
      >
        <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
        <Group spacing="xs">
          <Button
            compact
            disabled
            variant="subtle"
          >
            <RiHeartLine size={20} />
          </Button>
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                variant="subtle"
              >
                <RiMoreFill size={20} />
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {PLAY_TYPES.filter((type) => type.play !== playButtonBehavior).map((type) => (
                <DropdownMenu.Item
                  key={`playtype-${type.play}`}
                  onClick={() => handlePlay(type.play)}
                >
                  {type.label}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Divider />
              <DropdownMenu.Item disabled>Add to playlist</DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Group>
      </Group>
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
        getRowId={(data) => data.data.id}
        rowData={detailQuery.data?.songs}
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
      <Stack
        ref={cq.ref}
        mt="5rem"
      >
        {carousels.map((carousel, index) => (
          <GridCarousel
            key={`carousel-${carousel.uniqueId}-${index}`}
            cardRows={[
              {
                property: 'name',
                route: {
                  route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                },
              },
              {
                arrayProperty: 'name',
                property: 'albumArtists',
                route: {
                  route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                },
              },
            ]}
            containerWidth={cq.width}
            data={carousel.data}
            loading={carousel.loading}
            pagination={carousel.pagination}
            uniqueId={carousel.uniqueId}
          >
            <GridCarousel.Title>{carousel.title}</GridCarousel.Title>
          </GridCarousel>
        ))}
      </Stack>
    </ContentContainer>
  );
};
