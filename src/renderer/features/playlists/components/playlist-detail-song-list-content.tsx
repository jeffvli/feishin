import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { useListContext } from '/@/renderer/context/list-context';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { PlaylistDetailSongListEditTable } from '/@/renderer/features/playlists/components/playlist-detail-song-list-table';
import { useCurrentServer, useListSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { PlaylistSongListQuery, PlaylistSongListResponse } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType, TableColumn } from '/@/shared/types/types';

const PlaylistDetailSongListTable = lazy(() =>
    import('/@/renderer/features/playlists/components/playlist-detail-song-list-table').then(
        (module) => ({
            default: module.PlaylistDetailSongListTable,
        }),
    ),
);

export const PlaylistDetailSongListContent = () => {
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const { setItemCount } = useListContext();
    const queryClient = useQueryClient();

    const playlistSongsQuery = useSuspenseQuery(
        playlistsQueries.songList({
            query: {
                id: playlistId,
            },
            serverId: server?.id,
        }),
    );

    useEffect(() => {
        if (
            playlistSongsQuery.data?.totalRecordCount !== undefined &&
            playlistSongsQuery.data.totalRecordCount !== null
        ) {
            setItemCount?.(playlistSongsQuery.data.totalRecordCount);
        }
    }, [playlistSongsQuery.data?.totalRecordCount, setItemCount]);

    useEffect(() => {
        const handleRefresh = async (payload: { key: string }) => {
            if (payload.key !== ItemListKey.PLAYLIST_SONG) {
                return;
            }

            const queryKey = playlistsQueries.songList({
                query: {
                    id: playlistId,
                },
                serverId: server?.id,
            }).queryKey;

            await queryClient.invalidateQueries({ queryKey });
            await queryClient.refetchQueries({ queryKey });
        };

        eventEmitter.on('ITEM_LIST_REFRESH', handleRefresh);

        return () => {
            eventEmitter.off('ITEM_LIST_REFRESH', handleRefresh);
        };
    }, [playlistId, queryClient, server.id]);

    return (
        <Suspense fallback={<Spinner container />}>
            <PlaylistDetailSongList data={playlistSongsQuery.data} />
        </Suspense>
    );
};

export type OverridePlaylistSongListQuery = Omit<Partial<PlaylistSongListQuery>, 'id'>;

export const PlaylistDetailSongListView = ({ data }: { data: PlaylistSongListResponse }) => {
    const server = useCurrentServer();
    const { display, table } = useListSettings(ItemListKey.PLAYLIST_SONG);

    switch (display) {
        case ListDisplayType.TABLE: {
            return (
                <PlaylistDetailSongListTable
                    autoFitColumns={table.autoFitColumns}
                    columns={table.columns}
                    data={data}
                    enableAlternateRowColors={table.enableAlternateRowColors}
                    enableHorizontalBorders={table.enableHorizontalBorders}
                    enableRowHoverHighlight={table.enableRowHoverHighlight}
                    enableVerticalBorders={table.enableVerticalBorders}
                    serverId={server.id}
                    size={table.size}
                />
            );
        }
        default:
            return null;
    }
};

export const PlaylistDetailSongListEdit = ({ data }: { data: PlaylistSongListResponse }) => {
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const { display, table } = useListSettings(ItemListKey.PLAYLIST_SONG);

    const [localData, setLocalData] = useState<PlaylistSongListResponse>(data);

    const tableRef = useRef<ItemListHandle | null>(null);

    // Listen for playlist reorder events
    useEffect(() => {
        const handleReorder = (payload: {
            edge: 'bottom' | 'top' | null;
            playlistId: string;
            sourceIds: string[];
            targetId: string;
        }) => {
            // Only handle events for this playlist
            if (payload.playlistId !== playlistId) {
                return;
            }

            setLocalData((prev) => {
                if (!prev?.items || !payload.edge) {
                    return prev;
                }

                // Create a list of IDs in current order
                const currentIds = prev.items.map((item) => item.id);

                // Find the target index
                const targetIndex = currentIds.indexOf(payload.targetId);
                if (targetIndex === -1) {
                    return prev;
                }

                // Remove all source IDs from their current positions
                const idsWithoutSources = currentIds.filter(
                    (id) => !payload.sourceIds.includes(id),
                );

                // Calculate the insertion index based on the original target position
                const sourcesBeforeTarget = payload.sourceIds.filter((id) => {
                    const sourceIndex = currentIds.indexOf(id);
                    return sourceIndex !== -1 && sourceIndex < targetIndex;
                }).length;

                // Calculate the insert index in the filtered list
                const insertIndexInFiltered =
                    payload.edge === 'top'
                        ? targetIndex - sourcesBeforeTarget
                        : targetIndex - sourcesBeforeTarget + 1;

                // Ensure insertIndex is within bounds
                const insertIndex = Math.max(
                    0,
                    Math.min(insertIndexInFiltered, idsWithoutSources.length),
                );

                // Insert source IDs at the calculated position
                const reorderedIds = [
                    ...idsWithoutSources.slice(0, insertIndex),
                    ...payload.sourceIds,
                    ...idsWithoutSources.slice(insertIndex),
                ];

                // Create a map for quick lookup
                const itemMap = new Map(prev.items.map((item) => [item.id, item]));

                // Reorder items based on new ID order
                const reorderedItems = reorderedIds
                    .map((id) => itemMap.get(id))
                    .filter((item): item is NonNullable<typeof item> => item !== undefined);

                return {
                    ...prev,
                    items: reorderedItems,
                };
            });
        };

        eventEmitter.on('PLAYLIST_REORDER', handleReorder);

        return () => {
            eventEmitter.off('PLAYLIST_REORDER', handleReorder);
        };
    }, [playlistId]);

    const columns = useMemo(() => {
        return [
            {
                align: 'center' as 'center' | 'end' | 'start',
                id: TableColumn.PLAYLIST_REORDER,
                isEnabled: true,
                pinned: 'left' as 'left' | 'right' | null,
                width: 100,
            },
            ...table.columns,
        ];
    }, [table.columns]);

    const { setListData } = useListContext();

    useEffect(() => {
        setListData?.(localData.items);
    }, [localData, setListData]);

    switch (display) {
        case ListDisplayType.TABLE: {
            return (
                <PlaylistDetailSongListEditTable
                    autoFitColumns={table.autoFitColumns}
                    columns={columns}
                    data={localData}
                    enableAlternateRowColors={table.enableAlternateRowColors}
                    enableHorizontalBorders={table.enableHorizontalBorders}
                    enableRowHoverHighlight={table.enableRowHoverHighlight}
                    enableVerticalBorders={table.enableVerticalBorders}
                    ref={tableRef}
                    serverId={server.id}
                    size={table.size}
                />
            );
        }
        default:
            return null;
    }
};

const PlaylistDetailSongList = ({ data }: { data: PlaylistSongListResponse }) => {
    const { isSmartPlaylist, mode } = useListContext();

    if (isSmartPlaylist) {
        return <PlaylistDetailSongListView data={data} />;
    }

    switch (mode) {
        case 'edit':
            return <PlaylistDetailSongListEdit data={data} />;
        case 'view':
            return <PlaylistDetailSongListView data={data} />;
        default:
            return null;
    }
};
