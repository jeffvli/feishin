import { useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { VirtualGridAutoSizerContainer } from '../../../components/virtual-grid/virtual-grid-wrapper';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtist, AlbumArtistListSort, LibraryItem } from '/@/renderer/api/types';
import { ALBUMARTIST_CARD_ROWS } from '/@/renderer/components';
import { VirtualInfiniteGrid, VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useAlbumArtistListContext } from '/@/renderer/features/artists/context/album-artist-list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useAlbumArtistListFilter,
    useAlbumArtistListStore,
    useCurrentServer,
    useListStoreActions,
} from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';

interface AlbumArtistListGridViewProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
}

export const AlbumArtistListGridView = ({ itemCount, gridRef }: AlbumArtistListGridViewProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();

    const { id, pageKey } = useAlbumArtistListContext();
    const filter = useAlbumArtistListFilter({ id, key: pageKey });
    const { grid, display } = useAlbumArtistListStore();
    const { setGrid } = useListStoreActions();

    const fetch = useCallback(
        async ({ skip: startIndex, take: limit }: { skip: number; take: number }) => {
            const queryKey = queryKeys.albumArtists.list(server?.id || '', {
                limit,
                startIndex,
                ...filter,
            });

            const albumArtistsRes = await queryClient.fetchQuery(
                queryKey,
                async ({ signal }) =>
                    api.controller.getAlbumArtistList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query: {
                            limit,
                            startIndex,
                            ...filter,
                        },
                    }),
                { cacheTime: 1000 * 60 * 1 },
            );

            return albumArtistsRes;
        },
        [filter, queryClient, server],
    );

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
        },
        [pageKey, setGrid],
    );

    const cardRows = useMemo(() => {
        const rows: CardRow<AlbumArtist>[] = [ALBUMARTIST_CARD_ROWS.name];

        switch (filter.sortBy) {
            case AlbumArtistListSort.DURATION:
                rows.push(ALBUMARTIST_CARD_ROWS.duration);
                break;
            case AlbumArtistListSort.FAVORITED:
                break;
            case AlbumArtistListSort.NAME:
                break;
            case AlbumArtistListSort.ALBUM_COUNT:
                rows.push(ALBUMARTIST_CARD_ROWS.albumCount);
                break;
            case AlbumArtistListSort.PLAY_COUNT:
                rows.push(ALBUMARTIST_CARD_ROWS.playCount);
                break;
            case AlbumArtistListSort.RANDOM:
                break;
            case AlbumArtistListSort.RATING:
                rows.push(ALBUMARTIST_CARD_ROWS.rating);
                break;
            case AlbumArtistListSort.RECENTLY_ADDED:
                break;
            case AlbumArtistListSort.SONG_COUNT:
                rows.push(ALBUMARTIST_CARD_ROWS.songCount);
                break;
            case AlbumArtistListSort.RELEASE_DATE:
                break;
        }

        return rows;
    }, [filter.sortBy]);

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualInfiniteGrid
                        ref={gridRef}
                        cardRows={cardRows}
                        display={display || ListDisplayType.CARD}
                        fetchFn={fetch}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        height={height}
                        initialScrollOffset={grid?.scrollOffset || 0}
                        itemCount={itemCount || 0}
                        itemGap={20}
                        itemSize={grid?.itemsPerRow || 5}
                        itemType={LibraryItem.ALBUM_ARTIST}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        route={{
                            route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                            slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                        }}
                        width={width}
                        onScroll={handleGridScroll}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};
