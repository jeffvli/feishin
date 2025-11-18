import { useDebouncedValue, useMergedRef } from '@mantine/hooks';
import { forwardRef, ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import { useItemListColumnReorder } from '/@/renderer/components/item-list/helpers/use-item-list-column-reorder';
import { useItemListColumnResize } from '/@/renderer/components/item-list/helpers/use-item-list-column-resize';
import {
    ItemTableList,
    TableGroupHeader,
} from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import {
    subscribeCurrentTrack,
    subscribePlayerQueue,
    useListSettings,
    usePlayerActions,
    usePlayerQueueType,
} from '/@/renderer/store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { Box } from '/@/shared/components/box/box';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { Text } from '/@/shared/components/text/text';
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
                            <Group align="center" h="100%" px="md" w="100%" wrap="nowrap">
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
                            </Group>
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

    console.log(groups);

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
        <Box className="play-queue" pos="relative" style={{ flex: 1, minHeight: 0 }} w="100%">
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
        </Box>
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
            className="empty-queue-drop-zone"
            direction="column"
            gap="md"
            justify="center"
            ref={ref}
            style={{
                backgroundColor: 'var(--theme-colors-background)',
                borderRadius: 'var(--theme-radius-md)',
                bottom: 0,
                left: 0,
                opacity: 0.6,
                outline: isDraggedOver ? '2px solid var(--theme-colors-primary)' : 'none',
                outlineOffset: '-4px',
                position: 'absolute',
                right: 0,
                top: '40px',
                zIndex: 10,
            }}
            w="100%"
        />
    );
};
