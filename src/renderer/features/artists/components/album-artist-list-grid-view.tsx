import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useMemo } from 'react';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { VirtualGridAutoSizerContainer } from '../../../components/virtual-grid/virtual-grid-wrapper';
import { useListStoreByKey } from '../../../store/list.store';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    AlbumArtist,
    AlbumArtistListQuery,
    AlbumArtistListResponse,
    AlbumArtistListSort,
    LibraryItem,
} from '/@/renderer/api/types';
import { ALBUMARTIST_CARD_ROWS } from '/@/renderer/components';
import { VirtualInfiniteGrid, VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions } from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';
import { useHandleFavorite } from '/@/renderer/features/shared/hooks/use-handle-favorite';

interface AlbumArtistListGridViewProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
}

export const AlbumArtistListGridView = ({ itemCount, gridRef }: AlbumArtistListGridViewProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();

    const { pageKey } = useListContext();
    const { grid, display, filter } = useListStoreByKey<AlbumArtistListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();
    const handleFavorite = useHandleFavorite({ gridRef, server });

    const fetchInitialData = useCallback(() => {
        const query: Omit<AlbumArtistListQuery, 'startIndex' | 'limit'> = {
            ...filter,
        };

        const queriesFromCache: [QueryKey, AlbumArtistListResponse][] = queryClient.getQueriesData({
            exact: false,
            fetchStatus: 'idle',
            queryKey: queryKeys.albumArtists.list(server?.id || '', query),
            stale: false,
        });

        const itemData = [];

        for (const [, data] of queriesFromCache) {
            const { items, startIndex } = data || {};

            if (items && items.length !== 1 && startIndex !== undefined) {
                let itemIndex = 0;
                for (
                    let rowIndex = startIndex;
                    rowIndex < startIndex + items.length;
                    rowIndex += 1
                ) {
                    itemData[rowIndex] = items[itemIndex];
                    itemIndex += 1;
                }
            }
        }

        return itemData;
    }, [filter, queryClient, server?.id]);

    const fetch = useCallback(
        async ({ skip: startIndex, take: limit }: { skip: number; take: number }) => {
            const query: AlbumArtistListQuery = {
                ...filter,
                limit,
                startIndex,
            };

            const queryKey = queryKeys.albumArtists.list(server?.id || '', query);

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
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        ref={gridRef}
                        cardRows={cardRows}
                        display={display || ListDisplayType.CARD}
                        fetchFn={fetch}
                        fetchInitialData={fetchInitialData}
                        handleFavorite={handleFavorite}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        height={height}
                        initialScrollOffset={grid?.scrollOffset || 0}
                        itemCount={itemCount || 0}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
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
