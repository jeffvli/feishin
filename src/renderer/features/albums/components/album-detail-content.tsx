import { MutableRefObject, useCallback, useMemo } from 'react';
import {
  Button,
  getColumnDefs,
  GridCarousel,
  Text,
  TextTitle,
  useFixedTableHeader,
  VirtualTable,
} from '/@/renderer/components';
import { ColDef, RowDoubleClickedEvent, RowHeightParams, RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group, Stack } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { RiDiscFill, RiHeartFill, RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { generatePath, useParams } from 'react-router';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AppRoute } from '/@/renderer/router/routes';
import { useContainerQuery } from '/@/renderer/hooks';
import { PersistedTableColumn, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import {
  useHandleGeneralContextMenu,
  useHandleTableContextMenu,
} from '/@/renderer/features/context-menu';
import { Play, ServerType, TableColumn } from '/@/renderer/types';
import {
  ALBUM_CONTEXT_MENU_ITEMS,
  SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { PlayButton, useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { AlbumListSort, LibraryItem, QueueSong, SortOrder } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';

const isFullWidthRow = (node: RowNode) => {
  return node.id?.includes('disc-');
};

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
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

  // TODO: Make this customizable
  const columnDefs: ColDef[] = useMemo(() => {
    const userRatingColumn =
      detailQuery?.data?.serverType !== ServerType.JELLYFIN
        ? [
            {
              column: TableColumn.USER_RATING,
              width: 0,
            },
          ]
        : [];

    const cols: PersistedTableColumn[] = [
      {
        column: TableColumn.TRACK_NUMBER,
        width: 0,
      },
      {
        column: TableColumn.TITLE_COMBINED,
        width: 0,
      },

      {
        column: TableColumn.DURATION,
        width: 0,
      },
      {
        column: TableColumn.BIT_RATE,
        width: 0,
      },
      {
        column: TableColumn.PLAY_COUNT,
        width: 0,
      },
      {
        column: TableColumn.LAST_PLAYED,
        width: 0,
      },
      ...userRatingColumn,
      {
        column: TableColumn.USER_FAVORITE,
        width: 0,
      },
    ];
    return getColumnDefs(cols).filter((c) => c.colId !== 'album' && c.colId !== 'artist');
  }, [detailQuery?.data?.serverType]);

  const getRowHeight = useCallback((params: RowHeightParams) => {
    if (isFullWidthRow(params.node)) {
      return 45;
    }

    return 60;
  }, []);

  const songsRowData = useMemo(() => {
    if (!detailQuery.data?.songs) {
      return [];
    }

    const uniqueDiscNumbers = new Set(detailQuery.data?.songs.map((s) => s.discNumber));

    if (uniqueDiscNumbers.size === 1) {
      return detailQuery.data?.songs;
    }

    const rowData: (QueueSong | { id: string; name: string })[] = [];

    for (const discNumber of uniqueDiscNumbers.values()) {
      const songsByDiscNumber = detailQuery.data?.songs.filter((s) => s.discNumber === discNumber);
      rowData.push({ id: `disc-${discNumber}`, name: `DISC ${discNumber}` });
      rowData.push(...songsByDiscNumber);
    }

    return rowData;
  }, [detailQuery.data?.songs]);

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
          order={2}
          weight={700}
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

  const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;

  const { intersectRef, tableContainerRef } = useFixedTableHeader();

  const handleGeneralContextMenu = useHandleGeneralContextMenu(
    LibraryItem.ALBUM,
    ALBUM_CONTEXT_MENU_ITEMS,
  );

  return (
    <ContentContainer>
      <Box component="section">
        <Group
          ref={showGenres ? null : intersectRef}
          className="test"
          py="1rem"
          spacing="md"
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
            <Button
              compact
              variant="subtle"
              onClick={(e) => {
                if (!detailQuery?.data) return;
                handleGeneralContextMenu(e, [detailQuery.data!]);
              }}
            >
              <RiMoreFill size={20} />
            </Button>
          </Group>
        </Group>
      </Box>
      {showGenres && (
        <Box
          ref={showGenres ? intersectRef : null}
          component="section"
          py="1rem"
        >
          <Group>
            {detailQuery?.data?.genres?.map((genre) => (
              <Button
                key={`genre-${genre.id}`}
                compact
                component={Link}
                radius="md"
                size="sm"
                to={generatePath(`${AppRoute.LIBRARY_ALBUMS}?genre=${genre.id}`, { albumId })}
                variant="default"
              >
                {genre.name}
              </Button>
            ))}
          </Group>
        </Box>
      )}
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
          fullWidthCellRenderer={(data: any) => {
            if (!data.data) return null;
            return (
              <Group
                align="center"
                h="100%"
                spacing="sm"
              >
                <RiDiscFill />
                <Text>{data.data.name}</Text>
              </Group>
            );
          }}
          getRowHeight={getRowHeight}
          getRowId={(data) => data.data.id}
          isFullWidthRow={(data) => {
            return isFullWidthRow(data.rowNode) || false;
          }}
          isRowSelectable={(data) => {
            if (isFullWidthRow(data.data)) return false;
            return true;
          }}
          rowData={songsRowData}
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
