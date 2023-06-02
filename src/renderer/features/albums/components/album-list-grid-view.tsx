import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Album, AlbumListQuery, AlbumListSort, LibraryItem } from '/@/renderer/api/types';
import { ALBUM_CARD_ROWS } from '/@/renderer/components';
import {
  VirtualGridAutoSizerContainer,
  VirtualInfiniteGrid,
} from '/@/renderer/components/virtual-grid';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import {
  useAlbumListFilter,
  useAlbumListStore,
  useCurrentServer,
  useListStoreActions,
} from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';

export const AlbumListGridView = ({ gridRef, itemCount }: any) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const { id, pageKey } = useAlbumListContext();
  const { grid, display } = useAlbumListStore({ id, key: pageKey });
  const { setGrid } = useListStoreActions();
  const filter = useAlbumListFilter({ id, key: pageKey });

  const createFavoriteMutation = useCreateFavorite({});
  const deleteFavoriteMutation = useDeleteFavorite({});

  const handleFavorite = (options: {
    id: string[];
    isFavorite: boolean;
    itemType: LibraryItem;
  }) => {
    const { id, itemType, isFavorite } = options;
    if (isFavorite) {
      deleteFavoriteMutation.mutate({
        query: {
          id,
          type: itemType,
        },
        serverId: server?.id,
      });
    } else {
      createFavoriteMutation.mutate({
        query: {
          id,
          type: itemType,
        },
        serverId: server?.id,
      });
    }
  };

  const cardRows = useMemo(() => {
    const rows: CardRow<Album>[] = [ALBUM_CARD_ROWS.name];

    switch (filter.sortBy) {
      case AlbumListSort.ALBUM_ARTIST:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.ARTIST:
        rows.push(ALBUM_CARD_ROWS.artists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.COMMUNITY_RATING:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        break;
      case AlbumListSort.DURATION:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.duration);
        break;
      case AlbumListSort.FAVORITED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.NAME:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.PLAY_COUNT:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.playCount);
        break;
      case AlbumListSort.RANDOM:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.RATING:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.rating);
        break;
      case AlbumListSort.RECENTLY_ADDED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.createdAt);
        break;
      case AlbumListSort.RECENTLY_PLAYED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.lastPlayedAt);
        break;
      case AlbumListSort.SONG_COUNT:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.songCount);
        break;
      case AlbumListSort.YEAR:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.RELEASE_DATE:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseDate);
    }

    return rows;
  }, [filter.sortBy]);

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
    },
    [pageKey, setGrid],
  );

  const fetch = useCallback(
    async ({ skip, take }: { skip: number; take: number }) => {
      if (!server) {
        return [];
      }

      const query: AlbumListQuery = {
        limit: take,
        startIndex: skip,
        ...filter,
        _custom: {
          jellyfin: {
            ...filter._custom?.jellyfin,
          },
          navidrome: {
            ...filter._custom?.navidrome,
          },
        },
      };

      const queryKey = queryKeys.albums.list(server?.id || '', query);

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          apiClientProps: {
            server,
            signal,
          },
          query,
        }),
      );

      return albums;
    },
    [filter, queryClient, server],
  );

  return (
    <VirtualGridAutoSizerContainer>
      <AutoSizer>
        {({ height, width }) => (
          <VirtualInfiniteGrid
            key={`album-list-${server?.id}-${display}`}
            ref={gridRef}
            cardRows={cardRows}
            display={display || ListDisplayType.CARD}
            fetchFn={fetch}
            handleFavorite={handleFavorite}
            handlePlayQueueAdd={handlePlayQueueAdd}
            height={height}
            initialScrollOffset={grid?.scrollOffset || 0}
            itemCount={itemCount || 0}
            itemGap={20}
            itemSize={grid?.itemsPerRow || 5}
            itemType={LibraryItem.ALBUM}
            loading={itemCount === undefined || itemCount === null}
            minimumBatchSize={40}
            route={{
              route: AppRoute.LIBRARY_ALBUMS_DETAIL,
              slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
            }}
            width={width}
            onScroll={handleGridScroll}
          />
        )}
      </AutoSizer>
    </VirtualGridAutoSizerContainer>
  );
};
