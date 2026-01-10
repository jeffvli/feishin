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
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import {
    isShuffleEnabled,
    mapShuffledToQueueIndex,
    subscribeCurrentTrack,
    subscribePlayerQueue,
    useFollowCurrentSong,
    useListSettings,
    usePlayerActions,
    usePlayerQueueType,
    usePlayerSong,
    usePlayerStore,
} from '/@/renderer/store';
import { Flex } from '/@/shared/components/flex/flex';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { useFocusWithin } from '/@/shared/hooks/use-focus-within';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { Folder, LibraryItem, QueueSong, Song } from '/@/shared/types/domain-types';
import { DragTarget } from '/@/shared/types/drag-and-drop';
import { ItemListKey, Play, PlayerQueueType } from '/@/shared/types/types';

type QueueProps = {
    enableScrollShadow?: boolean;
    listKey: ItemListKey;
    searchTerm: string | undefined;
};

export const PlayQueue = forwardRef<ItemListHandle, QueueProps>(
    ({ enableScrollShadow = true, listKey, searchTerm }, ref) => {
        const { table } = useListSettings(listKey) || {};

        const isFetching = useIsPlayerFetching();
        const tableRef = useRef<ItemListHandle>(null);
        const mergedRef = useMergedRef(ref, tableRef);
        const { getQueue } = usePlayerActions();
        const queueType = usePlayerQueueType();
        const followCurrentSong = useFollowCurrentSong();

        const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 200);

        const [data, setData] = useState<QueueSong[]>([]);
        const [groups, setGroups] = useState<TableGroupHeader[]>([]);

        useEffect(() => {
            const setQueue = () => {
                const queue = getQueue() || { groups: [], items: [] };

                setData(queue.items);

                if (
                    queueType === PlayerQueueType.PRIORITY &&
                    queue.groups &&
                    queue.groups.length > 0
                ) {
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
                if (followCurrentSong && e.index !== -1) {
                    tableRef.current?.scrollToIndex(e.index, {
                        align: 'center',
                        behavior: 'auto',
                    });
                }
            });

            const handleAutoDJQueueAdded = () => {
                if (followCurrentSong) {
                    const state = usePlayerStore.getState();
                    let index = state.player.index;

                    if (isShuffleEnabled(state)) {
                        index = mapShuffledToQueueIndex(index, state.queue.shuffled);
                    }

                    if (index !== -1) {
                        // Use setTimeout to ensure the DOM has updated with the new queue items
                        setTimeout(() => {
                            tableRef.current?.scrollToIndex(index, {
                                align: 'center',
                                behavior: 'auto',
                            });
                        }, 0);
                    }
                }
            };

            eventEmitter.on('AUTODJ_QUEUE_ADDED', handleAutoDJQueueAdded);

            setQueue();

            return () => {
                unsub();
                unsubCurrentTrack();
                eventEmitter.off('AUTODJ_QUEUE_ADDED', handleAutoDJQueueAdded);
            };
        }, [getQueue, queueType, tableRef, followCurrentSong]);

        const filteredData: QueueSong[] = useMemo(() => {
            if (debouncedSearchTerm) {
                const searched = searchLibraryItems(data, debouncedSearchTerm, LibraryItem.SONG);
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

        const currentSong = usePlayerSong();

        const currentSongUniqueId = currentSong?._uniqueId;

        const { focused, ref: containerFocusRef } = useFocusWithin();
        const player = usePlayer();

        useHotkeys([
            [
                'delete',
                () => {
                    if (focused) {
                        const selectedItems =
                            tableRef.current?.internalState.getSelected() as QueueSong[];

                        if (!selectedItems || selectedItems.length === 0) {
                            return;
                        }

                        player.clearSelected(selectedItems);
                    }
                },
            ],
        ]);

        return (
            <div className={styles.container} ref={containerFocusRef}>
                <LoadingOverlay pos="absolute" visible={isFetching} />
                <ItemTableList
                    activeRowId={currentSongUniqueId}
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
                    enableScrollShadow={enableScrollShadow}
                    enableSelection
                    enableSelectionDialog={false}
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
    },
);

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
                        case DragTarget.FOLDER: {
                            const items = args.source.item;

                            const { folders, songs } = (items || []).reduce<{
                                folders: Folder[];
                                songs: Song[];
                            }>(
                                (acc, item) => {
                                    if ((item as unknown as Song)._itemType === LibraryItem.SONG) {
                                        acc.songs.push(item as unknown as Song);
                                    } else if (
                                        (item as unknown as Folder)._itemType === LibraryItem.FOLDER
                                    ) {
                                        acc.folders.push(item as unknown as Folder);
                                    }
                                    return acc;
                                },
                                { folders: [], songs: [] },
                            );

                            const folderIds = folders.map((folder) => folder.id);

                            // Handle folders: fetch and add to queue
                            if (folderIds.length > 0) {
                                playerContext.addToQueueByFetch(
                                    sourceServerId,
                                    folderIds,
                                    LibraryItem.FOLDER,
                                    Play.NOW,
                                );
                            }

                            // Handle songs: add directly to queue
                            if (songs.length > 0) {
                                playerContext.addToQueueByData(songs, Play.NOW);
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
