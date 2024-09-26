import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useMemo } from 'react';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { useListContext } from '../../../context/list-context';
import { useListStoreActions } from '../../../store/list.store';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    LibraryItem,
    Playlist,
    PlaylistListQuery,
    PlaylistListResponse,
    PlaylistListSort,
} from '/@/renderer/api/types';
import { PLAYLIST_CARD_ROWS } from '/@/renderer/components';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
    VirtualInfiniteGridRef,
} from '/@/renderer/components/virtual-grid';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';
import { useHandleFavorite } from '/@/renderer/features/shared/hooks/use-handle-favorite';

interface PlaylistListGridViewProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
}

export const PlaylistListGridView = ({ gridRef, itemCount }: PlaylistListGridViewProps) => {
    const { pageKey } = useListContext();
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { display, grid, filter } = useListStoreByKey<PlaylistListQuery>({ key: pageKey });
    const { setGrid } = useListStoreActions();
    const handleFavorite = useHandleFavorite({ gridRef, server });

    const cardRows = useMemo(() => {
        const rows: CardRow<Playlist>[] = [PLAYLIST_CARD_ROWS.nameFull];

        switch (filter.sortBy) {
            case PlaylistListSort.DURATION:
                rows.push(PLAYLIST_CARD_ROWS.duration);
                break;
            case PlaylistListSort.NAME:
                rows.push(PLAYLIST_CARD_ROWS.songCount);
                break;
            case PlaylistListSort.SONG_COUNT:
                rows.push(PLAYLIST_CARD_ROWS.songCount);
                break;
            case PlaylistListSort.OWNER:
                rows.push(PLAYLIST_CARD_ROWS.owner);
                break;
            case PlaylistListSort.PUBLIC:
                rows.push(PLAYLIST_CARD_ROWS.public);
                break;
            case PlaylistListSort.UPDATED_AT:
                break;
        }

        return rows;
    }, [filter.sortBy]);

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
        },
        [pageKey, setGrid],
    );

    const fetchInitialData = useCallback(() => {
        const query: Omit<PlaylistListQuery, 'startIndex' | 'limit'> = {
            ...filter,
        };

        const queriesFromCache: [QueryKey, PlaylistListResponse][] = queryClient.getQueriesData({
            exact: false,
            fetchStatus: 'idle',
            queryKey: queryKeys.playlists.list(server?.id || '', query),
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
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return [];
            }

            const query: PlaylistListQuery = {
                limit: take,
                ...filter,
                _custom: {},
                startIndex: skip,
            };

            const queryKey = queryKeys.playlists.list(server?.id || '', query);

            const playlists = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
                controller.getPlaylistList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query,
                }),
            );

            return playlists;
        },
        [filter, queryClient, server],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }: Size) => (
                    <VirtualInfiniteGrid
                        key={`playlist-list-${server?.id}`}
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
                        itemType={LibraryItem.PLAYLIST}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        route={{
                            route: AppRoute.PLAYLISTS_DETAIL_SONGS,
                            slugs: [{ idProperty: 'id', slugProperty: 'playlistId' }],
                        }}
                        width={width}
                        onScroll={handleGridScroll}
                    />
                )}
            </AutoSizer>
        </VirtualGridAutoSizerContainer>
    );
};
