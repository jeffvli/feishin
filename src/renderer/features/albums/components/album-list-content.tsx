import {
  ALBUM_CARD_ROWS,
  VirtualGridAutoSizerContainer,
  VirtualInfiniteGrid,
  VirtualInfiniteGridRef,
} from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import { CardDisplayType, CardRow, LibraryItem } from '/@/renderer/types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { ListOnScrollProps } from 'react-window';
import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Album, AlbumListSort } from '/@/renderer/api/types';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentServer, useSetAlbumStore, useAlbumListStore } from '/@/renderer/store';

interface AlbumListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
}

export const AlbumListContent = ({ gridRef }: AlbumListContentProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = useAlbumListStore();
  const setPage = useSetAlbumStore();
  const handlePlayQueueAdd = useHandlePlayQueueAdd();

  const albumListQuery = useAlbumList({
    limit: 1,
    startIndex: 0,
    ...page.filter,
  });

  const fetch = useCallback(
    async ({ skip, take }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        limit: take,
        startIndex: skip,
        ...page.filter,
      });

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query: {
            limit: take,
            startIndex: skip,
            ...page.filter,
          },
          server,
          signal,
        }),
      );

      return api.normalize.albumList(albums, server);
    },
    [page.filter, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setPage({
        list: {
          ...page,
          grid: {
            ...page.grid,
            scrollOffset: e.scrollOffset,
          },
        },
      });
    },
    [page, setPage],
  );

  const cardRows = useMemo(() => {
    const rows: CardRow<Album>[] = [ALBUM_CARD_ROWS.name];

    switch (page.filter.sortBy) {
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
  }, [page.filter.sortBy]);

  return (
    <VirtualGridAutoSizerContainer>
      <AutoSizer>
        {({ height, width }) => (
          <VirtualInfiniteGrid
            ref={gridRef}
            cardRows={cardRows}
            display={page.display || CardDisplayType.CARD}
            fetchFn={fetch}
            handlePlayQueueAdd={handlePlayQueueAdd}
            height={height}
            initialScrollOffset={page?.grid.scrollOffset || 0}
            itemCount={albumListQuery?.data?.totalRecordCount || 0}
            itemGap={20}
            itemSize={150 + page.grid?.size}
            itemType={LibraryItem.ALBUM}
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
