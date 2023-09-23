import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    LibraryItem,
    Song,
    SongListQuery,
    SongListResponse,
    SongListSort,
} from '/@/renderer/api/types';
import { SONG_CARD_ROWS } from '/@/renderer/components';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
} from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';

export const SongListGridView = ({ gridRef, itemCount }: any) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { pageKey, customFilters, id } = useListContext();
    const { grid, display, filter } = useListStoreByKey({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

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
    }, [customFilters, filter, id, queryClient, server?.id]);

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return [];
            }

            const query: SongListQuery = {
                imageSize: 250,
                limit: take,
                startIndex: skip,
                ...filter,
                ...customFilters,
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
                        key={`song-list-${server?.id}-${display}`}
                        ref={gridRef}
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
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        route={{
                            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                            slugs: [{ idProperty: 'albumId', slugProperty: 'albumId' }],
                        }}
                        width={width}
                        onScroll={handleGridScroll}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};
