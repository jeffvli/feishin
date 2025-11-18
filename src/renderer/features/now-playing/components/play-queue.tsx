import clsx from 'clsx';
import { forwardRef, ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import styles from './play-queue.module.css';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import {
    ItemTableList,
    TableGroupHeader,
} from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import {
    subscribeCurrentTrack,
    subscribePlayerQueue,
    updateQueueFavorites,
    updateQueueRatings,
    useCurrentServerId,
    useListSettings,
    usePlayerActions,
    usePlayerQueueType,
} from '/@/renderer/store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { Flex } from '/@/shared/components/flex/flex';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { LibraryItem, QueueSong, Song } from '/@/shared/types/domain-types';
import { DragTarget } from '/@/shared/types/drag-and-drop';
import { ItemListKey, Play, PlayerQueueType } from '/@/shared/types/types';

type QueueProps = {
    listKey: ItemListKey;
    searchTerm: string | undefined;
};

export const PlayQueue = forwardRef<ItemListHandle, QueueProps>(({ listKey, searchTerm }, ref) => {
    const { table } = useListSettings(listKey) || {};

    const isFetching = useIsPlayerFetching();
    const tableRef = useRef<ItemListHandle>(null);
    const mergedRef = useMergedRef(ref, tableRef);
    const { getQueue } = usePlayerActions();
    const queueType = usePlayerQueueType();
    const serverId = useCurrentServerId();

    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 200);

    const [data, setData] = useState<QueueSong[]>([]);
    const [groups, setGroups] = useState<TableGroupHeader[]>([]);

    useEffect(() => {
        const setQueue = () => {
            const queue = getQueue() || { groups: [], items: [] };

            setData(queue.items);

            if (queueType === PlayerQueueType.PRIORITY && queue.groups && queue.groups.length > 0) {
                const transformedGroups: TableGroupHeader[] = queue.groups.map((group) => ({
                    itemCount: group.count,
                    render: (): ReactElement => {
                        return (
                            <div className={styles.groupRow}>
                                <Text
                                    fw={600}
                                    overflow="visible"
                                    size="md"
                                    style={{
                                        textWrap: 'nowrap',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {group.name}
                                </Text>
                            </div>
                        );
                    },
                    rowHeight: 40,
                }));
                setGroups(transformedGroups);
            } else {
                setGroups([]);
            }
        };

        const unsub = subscribePlayerQueue(() => {
            setQueue();
        });

        const unsubCurrentTrack = subscribeCurrentTrack((e) => {
            if (e.index !== -1) {
                tableRef.current?.scrollToIndex(e.index, {
                    align: 'top',
                    behavior: 'smooth',
                });
            }
        });

        setQueue();

        return () => {
            unsub();
            unsubCurrentTrack();
        };
    }, [getQueue, queueType, tableRef]);

    // Listen to favorite and rating events to update queue songs
    useEffect(() => {
        const handleFavorite = (payload: UserFavoriteEventPayload) => {
            if (payload.itemType !== LibraryItem.SONG || payload.serverId !== serverId) {
                return;
            }

            updateQueueFavorites(payload.id, payload.favorite);
        };

        const handleRating = (payload: UserRatingEventPayload) => {
            if (payload.itemType !== LibraryItem.SONG || payload.serverId !== serverId) {
                return;
            }

            updateQueueRatings(payload.id, payload.rating);
        };

        eventEmitter.on('USER_FAVORITE', handleFavorite);
        eventEmitter.on('USER_RATING', handleRating);

        return () => {
            eventEmitter.off('USER_FAVORITE', handleFavorite);
            eventEmitter.off('USER_RATING', handleRating);
        };
    }, [serverId]);

    const filteredData: QueueSong[] = useMemo(() => {
        if (debouncedSearchTerm) {
            const searched = searchSongs(data, debouncedSearchTerm);
            return searched;
        }

        return data;
    }, [data, debouncedSearchTerm]);

    const isEmpty = filteredData.length === 0;

    const { handleColumnReordered } = useItemListColumnReorder({
        itemListKey: listKey,
    });

    const { handleColumnResized } = useItemListColumnResize({
        itemListKey: listKey,
    });

    return (
        <div className={styles.container}>
            <LoadingOverlay pos="absolute" visible={isFetching} />
            <ItemTableList
                autoFitColumns={table.autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={table.columns}
                data={filteredData}
                enableAlternateRowColors={table.enableAlternateRowColors}
                enableDrag
                enableExpansion={false}
                enableHeader
                enableHorizontalBorders={table.enableHorizontalBorders}
                enableRowHoverHighlight={table.enableRowHoverHighlight}
                enableSelection
                enableVerticalBorders={table.enableVerticalBorders}
                getRowId="_uniqueId"
                groups={groups.length > 0 ? groups : undefined}
                initialTop={{
                    to: 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.QUEUE_SONG}
                onColumnReordered={handleColumnReordered}
                onColumnResized={handleColumnResized}
                ref={mergedRef}
                size={table.size}
            />
            {isEmpty && <EmptyQueueDropZone />}
        </div>
    );
});

const EmptyQueueDropZone = () => {
    const playerContext = usePlayer();

    const { isDraggedOver, ref } = useDragDrop<HTMLDivElement>({
        drop: {
            canDrop: () => {
                return true;
            },
            getData: () => {
                return {
                    id: [],
                    item: [],
                    itemType: LibraryItem.QUEUE_SONG,
                    type: DragTarget.QUEUE_SONG,
                };
            },
            onDrag: () => {
                return;
            },
            onDragLeave: () => {
                return;
            },
            onDrop: (args) => {
                if (args.self.type === DragTarget.QUEUE_SONG) {
                    const sourceServerId = (
                        args.source.item?.[0] as unknown as { _serverId: string }
                    )?._serverId;

                    const sourceItemType = args.source.itemType as LibraryItem;

                    switch (args.source.type) {
                        case DragTarget.ALBUM: {
                            if (sourceServerId) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    args.source.id,
                                    sourceItemType,
                                    Play.NOW,
                                );
                            }
                            break;
                        }
                        case DragTarget.ALBUM_ARTIST: {
                            if (sourceServerId) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    args.source.id,
                                    sourceItemType,
                                    Play.NOW,
                                );
                            }
                            break;
                        }
                        case DragTarget.ARTIST: {
                            if (sourceServerId) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    args.source.id,
                                    sourceItemType,
                                    Play.NOW,
                                );
                            }
                            break;
                        }
                        case DragTarget.GENRE: {
                            if (sourceServerId) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    args.source.id,
                                    sourceItemType,
                                    Play.NOW,
                                );
                            }
                            break;
                        }
                        case DragTarget.PLAYLIST: {
                            if (sourceServerId) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    args.source.id,
                                    sourceItemType,
                                    Play.NOW,
                                );
                            }
                            break;
                        }
                        case DragTarget.QUEUE_SONG: {
                            const sourceItems = (args.source.item || []) as QueueSong[];
                            if (sourceItems.length > 0) {
                                playerContext.addToQueueByData(sourceItems, Play.NOW);
                            }
                            break;
                        }
                        case DragTarget.SONG: {
                            const sourceItems = (args.source.item || []) as Song[];
                            if (sourceItems.length > 0) {
                                playerContext.addToQueueByData(sourceItems, Play.NOW);
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }

                return;
            },
        },
        isEnabled: true,
    });

    return (
        <Flex
            align="center"
            className={clsx(styles.dropZone, {
                [styles.draggedOver]: isDraggedOver,
            })}
            direction="column"
            gap="md"
            justify="center"
            ref={ref}
            w="100%"
        />
    );
};
