import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    Album,
    AlbumListQuery,
    AlbumListResponse,
    AlbumListSort,
    LibraryItem,
} from '/@/renderer/api/types';
import { ALBUM_CARD_ROWS } from '/@/renderer/components';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
} from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';
import { useHandleFavorite } from '/@/renderer/features/shared/hooks/use-handle-favorite';

export const AlbumListGridView = ({ gridRef, itemCount }: any) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { pageKey, customFilters, id } = useListContext();
    const { grid, display, filter } = useListStoreByKey<AlbumListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();

    const [searchParams, setSearchParams] = useSearchParams();
    const scrollOffset = searchParams.get('scrollOffset');
    const initialScrollOffset = Number(id ? scrollOffset : grid?.scrollOffset) || 0;

    const handleFavorite = useHandleFavorite({ gridRef, server });

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
        const query: AlbumListQuery = {
            ...filter,
            ...customFilters,
        };

        const queryKey = queryKeys.albums.list(server?.id || '', query, id);

        const queriesFromCache: [QueryKey, AlbumListResponse][] = queryClient.getQueriesData({
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

            const query: AlbumListQuery = {
                limit: take,
                ...filter,
                ...customFilters,
                startIndex: skip,
            };

            const queryKey = queryKeys.albums.list(server?.id || '', query, id);

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
        [customFilters, filter, id, queryClient, server],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        key={`album-list-${server?.id}-${display}`}
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
