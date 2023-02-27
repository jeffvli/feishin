import { useMemo } from 'react';
import {
  Button,
  getColumnDefs,
  GridCarousel,
  Text,
  TextTitle,
  VirtualTable,
} from '/@/renderer/components';
import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import { Box, Group, Stack } from '@mantine/core';
import { RiHeartFill, RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { generatePath, useParams } from 'react-router';
import { useCurrentServer } from '/@/renderer/store';
import { createSearchParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { AppRoute } from '/@/renderer/router/routes';
import { useContainerQuery } from '/@/renderer/hooks';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import {
  useHandleGeneralContextMenu,
  useHandleTableContextMenu,
} from '/@/renderer/features/context-menu';
import { Play, TableColumn } from '/@/renderer/types';
import {
  ARTIST_CONTEXT_MENU_ITEMS,
  SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { PlayButton, useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import {
  AlbumListSort,
  LibraryItem,
  QueueSong,
  ServerType,
  SortOrder,
} from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { useTopSongsList } from '/@/renderer/features/artists/queries/top-songs-list-query';

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 1rem 2rem 5rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%) !important;
  }

  .ag-header {
    margin-bottom: 0.5rem;
  }
`;

export const AlbumArtistDetailContent = () => {
  const { albumArtistId } = useParams() as { albumArtistId: string };
  const cq = useContainerQuery();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const server = useCurrentServer();
  const itemsPerPage = cq.isXl ? 9 : cq.isLg ? 7 : cq.isMd ? 5 : cq.isSm ? 4 : 3;

  const detailQuery = useAlbumArtistDetail({ id: albumArtistId });

  const artistDiscographyLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY, {
    albumArtistId,
  })}?${createSearchParams({
    artistId: albumArtistId,
    artistName: detailQuery?.data?.name || '',
  })}`;

  const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
    albumArtistId,
  })}?${createSearchParams({
    artistId: albumArtistId,
    artistName: detailQuery?.data?.name || '',
  })}`;

  const recentAlbumsQuery = useAlbumList({
    jfParams: server?.type === ServerType.JELLYFIN ? { artistIds: albumArtistId } : undefined,
    limit: itemsPerPage,
    ndParams:
      server?.type === ServerType.NAVIDROME
        ? { artist_id: albumArtistId, compilation: false }
        : undefined,
    sortBy: AlbumListSort.RELEASE_DATE,
    sortOrder: SortOrder.DESC,
    startIndex: 0,
  });

  const compilationAlbumsQuery = useAlbumList({
    jfParams:
      server?.type === ServerType.JELLYFIN ? { contributingArtistIds: albumArtistId } : undefined,
    limit: itemsPerPage,
    ndParams:
      server?.type === ServerType.NAVIDROME
        ? { artist_id: albumArtistId, compilation: true }
        : undefined,
    sortBy: AlbumListSort.RELEASE_DATE,
    sortOrder: SortOrder.DESC,
    startIndex: 0,
  });

  const topSongsQuery = useTopSongsList(
    { artist: detailQuery?.data?.name || '', artistId: albumArtistId },
    { enabled: !!detailQuery?.data?.name },
  );

  const topSongsColumnDefs: ColDef[] = useMemo(
    () =>
      getColumnDefs([
        { column: TableColumn.ROW_INDEX, width: 0 },
        { column: TableColumn.TITLE_COMBINED, width: 0 },
        { column: TableColumn.DURATION, width: 0 },
        { column: TableColumn.ALBUM, width: 0 },
        { column: TableColumn.YEAR, width: 0 },
        { column: TableColumn.PLAY_COUNT, width: 0 },
        { column: TableColumn.USER_FAVORITE, width: 0 },
      ]),
    [],
  );

  const cardRows = {
    album: [
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
    ],
    albumArtist: [
      {
        property: 'name',
        route: {
          route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
          slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
        },
      },
    ],
  };

  const carousels = [
    {
      data: recentAlbumsQuery?.data?.items,
      isHidden: !recentAlbumsQuery?.data?.items?.length,
      itemType: LibraryItem.ALBUM,
      loading: recentAlbumsQuery?.isLoading || recentAlbumsQuery.isFetching,
      pagination: {
        itemsPerPage,
      },
      title: (
        <>
          <TextTitle
            order={2}
            weight={700}
          >
            Recent releases
          </TextTitle>
          <Button
            compact
            uppercase
            component={Link}
            to={artistDiscographyLink}
            variant="subtle"
          >
            View discography
          </Button>
        </>
      ),
      uniqueId: 'recentReleases',
    },
    {
      data: compilationAlbumsQuery?.data?.items,
      isHidden: !compilationAlbumsQuery?.data?.items?.length,
      itemType: LibraryItem.ALBUM,
      loading: compilationAlbumsQuery?.isLoading || compilationAlbumsQuery.isFetching,
      pagination: {
        itemsPerPage,
      },
      title: (
        <TextTitle
          order={2}
          weight={700}
        >
          Appears on
        </TextTitle>
      ),
      uniqueId: 'compilationAlbums',
    },
    {
      data: detailQuery?.data?.similarArtists?.slice(0, itemsPerPage),
      isHidden: !detailQuery?.data?.similarArtists,
      itemType: LibraryItem.ALBUM_ARTIST,
      loading: detailQuery?.isLoading || detailQuery.isFetching,
      pagination: {
        itemsPerPage,
      },
      title: (
        <TextTitle
          order={2}
          weight={700}
        >
          Related artists
        </TextTitle>
      ),
      uniqueId: 'similarArtists',
    },
  ];

  const playButtonBehavior = usePlayButtonBehavior();

  const handlePlay = async (playType?: Play) => {
    handlePlayQueueAdd?.({
      byItemType: {
        id: [albumArtistId],
        type: LibraryItem.ALBUM_ARTIST,
      },
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
          type: LibraryItem.ALBUM_ARTIST,
        },
      });
    } else {
      createFavoriteMutation.mutate({
        query: {
          id: [detailQuery.data.id],
          type: LibraryItem.ALBUM_ARTIST,
        },
      });
    }
  };

  const handleGeneralContextMenu = useHandleGeneralContextMenu(
    LibraryItem.ALBUM_ARTIST,
    ARTIST_CONTEXT_MENU_ITEMS,
  );

  console.log('topSongsQuery?.data :>> ', topSongsQuery?.data);

  const topSongs = topSongsQuery?.data?.items?.slice(0, 10);

  const showBiography =
    detailQuery?.data?.biography !== undefined && detailQuery?.data?.biography !== null;
  const showTopSongs = topSongsQuery?.data?.items?.length;
  const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;

  const isLoading =
    detailQuery?.isLoading || (server?.type === ServerType.NAVIDROME && topSongsQuery?.isLoading);

  if (isLoading) return <ContentContainer ref={cq.ref} />;

  return (
    <ContentContainer ref={cq.ref}>
      <Box component="section">
        <Group spacing="md">
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
            <Button
              compact
              uppercase
              component={Link}
              to={artistDiscographyLink}
              variant="subtle"
            >
              View discography
            </Button>
            <Button
              compact
              uppercase
              component={Link}
              to={artistSongsLink}
              variant="subtle"
            >
              View all songs
            </Button>
          </Group>
        </Group>
      </Box>
      {showGenres && (
        <Box component="section">
          <Group>
            {detailQuery?.data?.genres?.map((genre) => (
              <Button
                key={`genre-${genre.id}`}
                compact
                component={Link}
                radius="md"
                size="sm"
                to={generatePath(`${AppRoute.LIBRARY_ALBUM_ARTISTS}?genre=${genre.id}`, {
                  albumArtistId,
                })}
                variant="default"
              >
                {genre.name}
              </Button>
            ))}
          </Group>
        </Box>
      )}
      {showBiography ? (
        <Box
          component="section"
          maw="1280px"
        >
          <TextTitle
            order={2}
            weight={700}
          >
            About {detailQuery?.data?.name}
          </TextTitle>
          <Text
            $secondary
            component="p"
            dangerouslySetInnerHTML={{ __html: detailQuery?.data?.biography || '' }}
            sx={{ textAlign: 'justify' }}
          />
        </Box>
      ) : null}
      {showTopSongs && (
        <Box component="section">
          <Group
            noWrap
            position="apart"
          >
            <Group
              noWrap
              align="flex-end"
            >
              <TextTitle
                order={2}
                weight={700}
              >
                Top Songs
              </TextTitle>
              <Button
                compact
                uppercase
                component={Link}
                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS, {
                  albumArtistId,
                })}
                variant="subtle"
              >
                View all
              </Button>
            </Group>
          </Group>
          <VirtualTable
            autoFitColumns
            autoHeight
            deselectOnClickOutside
            suppressCellFocus
            suppressHorizontalScroll
            suppressLoadingOverlay
            suppressRowDrag
            columnDefs={topSongsColumnDefs}
            enableCellChangeFlash={false}
            getRowId={(data) => data.data.uniqueId}
            rowData={topSongs}
            rowHeight={60}
            rowSelection="multiple"
            onCellContextMenu={handleContextMenu}
            onRowDoubleClicked={handleRowDoubleClick}
          />
        </Box>
      )}
      <Box component="section">
        <Stack spacing="xl">
          {carousels
            .filter((c) => !c.isHidden)
            .map((carousel) => (
              <GridCarousel
                key={`carousel-${carousel.uniqueId}`}
                cardRows={cardRows[carousel.itemType as keyof typeof cardRows]}
                containerWidth={cq.width}
                data={carousel.data}
                itemType={carousel.itemType}
                loading={carousel.loading}
                pagination={carousel.pagination}
                uniqueId={carousel.uniqueId}
              >
                <GridCarousel.Title>{carousel.title}</GridCarousel.Title>
              </GridCarousel>
            ))}
        </Stack>
      </Box>
    </ContentContainer>
  );
};
