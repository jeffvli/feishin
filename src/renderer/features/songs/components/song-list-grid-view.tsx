import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';

import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SONG_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
    VirtualInfiniteGridRef,
} from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useHandleFavorite } from '/@/renderer/features/shared/hooks/use-handle-favorite';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { useEventStore } from '/@/renderer/store/event.store';
import {
    LibraryItem,
    Song,
    SongListQuery,
    SongListResponse,
    SongListSort,
} from '/@/shared/types/domain-types';
import { CardRow, ListDisplayType } from '/@/shared/types/types';

interface SongListGridViewProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
}

export const SongListGridView = ({ gridRef, itemCount }: SongListGridViewProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { customFilters, id, pageKey } = useListContext();
    const { display, filter, grid } = useListStoreByKey<SongListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    const handleFavorite = useHandleFavorite({ gridRef, server });

    useEffect(() => {
        const unSub = useEventStore.subscribe((state) => {
            const event = state.event;
            if (event && event.event === 'favorite') {
                const idSet = new Set(state.ids);
                const userFavorite = event.favorite;

                gridRef.current?.updateItemData((data) => {
                    if (idSet.has(data.id)) {
                        return {
                            ...data,
                            userFavorite,
                        };
                    }
                    return data;
                });
            }
        });

        return () => {
            unSub();
        };
    }, [gridRef]);

    const cardRows = useMemo(() => {
        const rows: CardRow<Song>[] = [
            SONG_CARD_ROWS.name,
            SONG_CARD_ROWS.album,
            SONG_CARD_ROWS.albumArtists,
        ];

        switch (filter.sortBy) {
            case SongListSort.ALBUM:
                break;
            case SongListSort.ARTIST:
                break;
            case SongListSort.DURATION:
                rows.push(SONG_CARD_ROWS.duration);
                break;
            case SongListSort.FAVORITED:
                break;
            case SongListSort.NAME:
                break;
            case SongListSort.PLAY_COUNT:
                rows.push(SONG_CARD_ROWS.playCount);
                break;
            case SongListSort.RANDOM:
                break;
            case SongListSort.RATING:
                rows.push(SONG_CARD_ROWS.rating);
                break;
            case SongListSort.RECENTLY_ADDED:
                rows.push(SONG_CARD_ROWS.createdAt);
                break;
            case SongListSort.RECENTLY_PLAYED:
                rows.push(SONG_CARD_ROWS.lastPlayedAt);
                break;
            case SongListSort.YEAR:
                rows.push(SONG_CARD_ROWS.releaseYear);
                break;
            case SongListSort.RELEASE_DATE:
                rows.push(SONG_CARD_ROWS.releaseDate);
        }

        return rows;
    }, [filter.sortBy]);

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            if (id) {
                setSearchParams(
                    (params) => {
                        params.set('scrollOffset', String(e.scrollOffset));
                        return params;
                    },
                    { replace: true },
                );
            } else {
                setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
            }
        },
        [id, pageKey, setGrid, setSearchParams],
    );

    const fetchInitialData = useCallback(() => {
        const query: SongListQuery = {
            ...filter,
            ...customFilters,
        };

        const queryKey = queryKeys.songs.list(server?.id || '', query, id);

        const queriesFromCache: [QueryKey, SongListResponse][] = queryClient.getQueriesData({
            exact: false,
            fetchStatus: 'idle',
            queryKey,
            stale: false,
        });

        const itemData: Song[] = [];

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
    }, [customFilters, filter, id, queryClient, server?.id]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return [];
            }

            const query: SongListQuery = {
                imageSize: 250,
                limit: take,
                ...filter,
                ...customFilters,
                startIndex: skip,
            };

            const queryKey = queryKeys.songs.list(server?.id || '', query, id);

            const songs = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
                controller.getSongList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query,
                }),
            );

            return songs;
        },
        [customFilters, filter, id, queryClient, server],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        cardRows={cardRows}
                        display={display || ListDisplayType.CARD}
                        fetchFn={fetch}
                        fetchInitialData={fetchInitialData}
                        handleFavorite={handleFavorite}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        height={height}
                        initialScrollOffset={initialScrollOffset}
                        itemCount={itemCount || 0}
                        itemGap={grid?.itemGap ?? 10}
                        itemSize={grid?.itemSize || 200}
                        itemType={LibraryItem.SONG}
                        key={`song-list-${server?.id}-${display}`}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        onScroll={handleGridScroll}
                        ref={gridRef}
                        route={{
                            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
                        }}
                        width={width}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};
