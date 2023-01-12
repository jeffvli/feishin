import { MutableRefObject, useCallback, useMemo } from 'react';
import {
  Button,
  DropdownMenu,
  getColumnDefs,
  GridCarousel,
  TextTitle,
  useFixedTableHeader,
  VirtualTable,
} from '/@/renderer/components';
import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group, Stack } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { RiHeartFill, RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { useParams } from 'react-router';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useSongListStore } from '/@/renderer/store';
import styled from 'styled-components';
import { AppRoute } from '/@/renderer/router/routes';
import { useContainerQuery } from '/@/renderer/hooks';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { Play } from '/@/renderer/types';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import {
  PlayButton,
  PLAY_TYPES,
  useCreateFavorite,
  useDeleteFavorite,
} from '/@/renderer/features/shared';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { AlbumListSort, LibraryItem, QueueSong, SortOrder } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 1920px;
  padding: 1rem 2rem 5rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%) !important;
  }

  .ag-header {
    margin-bottom: 0.5rem;
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

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    handlePlayQueueAdd?.({
      byData: [e.data],
      play: playButtonBehavior,
    });
  };

  const createFavoriteMutation = useCreateFavorite();
  const deleteFavoriteMutation = useDeleteFavorite();

  const handleFavorite = () => {
    if (!detailQuery?.data) return;

    if (detailQuery.data.userFavorite) {
      deleteFavoriteMutation.mutate({
        query: {
          id: [detailQuery.data.id],
          type: LibraryItem.ALBUM,
        },
      });
    } else {
      createFavoriteMutation.mutate({
        query: {
          id: [detailQuery.data.id],
          type: LibraryItem.ALBUM,
        },
      });
    }
  };

  const { intersectRef, tableContainerRef } = useFixedTableHeader();

  return (
    <ContentContainer>
      <Group
        ref={intersectRef}
        className="test"
        pb="2rem"
        pt="1rem"
        spacing="lg"
      >
        <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
        <Group spacing="xs">
          <Button
            compact
            loading={createFavoriteMutation.isLoading || deleteFavoriteMutation.isLoading}
            variant="subtle"
            onClick={handleFavorite}
          >
            {detailQuery?.data?.userFavorite ? (
              <RiHeartFill
                color="red"
                size={20}
              />
            ) : (
              <RiHeartLine size={20} />
            )}
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
      <Box ref={tableContainerRef}>
        <VirtualTable
          ref={tableRef}
          autoFitColumns
          autoHeight
          deselectOnClickOutside
          suppressCellFocus
          suppressHorizontalScroll
          suppressLoadingOverlay
          suppressRowDrag
          columnDefs={columnDefs}
          enableCellChangeFlash={false}
          getRowId={(data) => data.data.id}
          rowData={detailQuery.data?.songs}
          rowHeight={60}
          rowSelection="multiple"
          onCellContextMenu={handleContextMenu}
          onRowDoubleClicked={handleRowDoubleClick}
        />
      </Box>
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
                  route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                },
              },
            ]}
            containerWidth={cq.width}
            data={carousel.data}
            itemType={LibraryItem.ALBUM}
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
