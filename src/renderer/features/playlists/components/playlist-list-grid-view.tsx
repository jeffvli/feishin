import { useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ListOnScrollProps } from 'react-window';
import { usePlaylistGridStore, usePlaylistStoreActions } from '../../../store/playlist.store';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, Playlist, PlaylistListQuery, PlaylistListSort } from '/@/renderer/api/types';
import { PLAYLIST_CARD_ROWS } from '/@/renderer/components';
import {
    VirtualGridAutoSizerContainer,
    VirtualInfiniteGrid,
    VirtualInfiniteGridRef,
} from '/@/renderer/components/virtual-grid';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings, usePlaylistListStore } from '/@/renderer/store';
import { CardRow, ListDisplayType } from '/@/renderer/types';

interface PlaylistListGridViewProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
}

export const PlaylistListGridView = ({ gridRef, itemCount }: PlaylistListGridViewProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const { display } = usePlaylistListStore();
    const grid = usePlaylistGridStore();
    const { setGrid } = usePlaylistStoreActions();
    const page = usePlaylistListStore();
    const { defaultFullPlaylist } = useGeneralSettings();

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
        const rows: CardRow<Playlist>[] = defaultFullPlaylist
            ? [PLAYLIST_CARD_ROWS.nameFull]
            : [PLAYLIST_CARD_ROWS.name];

        switch (page.filter.sortBy) {
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
    }, [defaultFullPlaylist, page.filter.sortBy]);

    const handleGridScroll = useCallback(
        (e: ListOnScrollProps) => {
            setGrid({ data: { scrollOffset: e.scrollOffset } });
        },
        [setGrid],
    );

    const fetch = useCallback(
        async ({ skip, take }: { skip: number; take: number }) => {
            if (!server) {
                return [];
            }

            const query: PlaylistListQuery = {
                limit: take,
                startIndex: skip,
                ...page.filter,
                _custom: {},
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
        [page.filter, queryClient, server],
    );

    return (
        <VirtualGridAutoSizerContainer>
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualInfiniteGrid
                        key={`playlist-list-${server?.id}`}
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
                        itemType={LibraryItem.PLAYLIST}
                        loading={itemCount === undefined || itemCount === null}
                        minimumBatchSize={40}
                        route={{
                            route: defaultFullPlaylist
                                ? AppRoute.PLAYLISTS_DETAIL_SONGS
                                : AppRoute.PLAYLISTS_DETAIL,
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
