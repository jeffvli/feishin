import { useDebouncedValue, useMergedRef } from '@mantine/hooks';
import { forwardRef, useMemo, useRef } from 'react';

import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import {
    useIsPlayerFetching,
    usePlayerContext,
} from '/@/renderer/features/player/context/player-context';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { useListSettings, usePlayerQueue } from '/@/renderer/store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { Box } from '/@/shared/components/box/box';
import { Flex } from '/@/shared/components/flex/flex';
import { LoadingOverlay } from '/@/shared/components/loading-overlay/loading-overlay';
import { LibraryItem, QueueSong, Song } from '/@/shared/types/domain-types';
import { DragTarget } from '/@/shared/types/drag-and-drop';
import { ItemListKey, Play } from '/@/shared/types/types';

type QueueProps = {
    listKey: ItemListKey;
    searchTerm: string | undefined;
};

export const PlayQueue = forwardRef<ItemListHandle, QueueProps>(({ listKey, searchTerm }, ref) => {
    const { table } = useListSettings(listKey) || {};

    const queue = usePlayerQueue();
    const isFetching = useIsPlayerFetching();
    const tableRef = useRef<ItemListHandle>(null);
    const mergedRef = useMergedRef(ref, tableRef);

    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 200);

    const data: QueueSong[] = useMemo(() => {
        if (debouncedSearchTerm) {
            return searchSongs(queue, debouncedSearchTerm);
        }

        return queue;
    }, [queue, debouncedSearchTerm]);

    const isEmpty = data.length === 0;

    usePlayerEvents(
        {
            onCurrentSongChange: (properties) => {
                const currentSong = properties.song;
                if (!currentSong || !tableRef.current) {
                    return;
                }

                const songIndex = data.findIndex(
                    (song) => song._uniqueId === currentSong._uniqueId,
                );

                if (songIndex !== -1) {
                    tableRef.current.scrollToIndex(songIndex, { align: 'center' });
                }
            },
        },
        [data],
    );

    return (
        <Box className="play-queue" pos="relative" style={{ flex: 1, minHeight: 0 }} w="100%">
            <LoadingOverlay pos="absolute" visible={isFetching} />
            <ItemTableList
                autoFitColumns={table.autoFitColumns}
                CellComponent={ItemTableListColumn}
                columns={table.columns}
                data={data}
                enableAlternateRowColors={table.enableAlternateRowColors}
                enableDrag={true}
                enableExpansion={false}
                enableHeader={true}
                enableHorizontalBorders={table.enableHorizontalBorders}
                enableRowHoverHighlight={table.enableRowHoverHighlight}
                enableSelection={true}
                enableVerticalBorders={table.enableVerticalBorders}
                getRowId="_uniqueId"
                initialTop={{
                    to: 0,
                    type: 'offset',
                }}
                itemType={LibraryItem.QUEUE_SONG}
                ref={mergedRef}
                size={table.size}
            />
            {isEmpty && <EmptyQueueDropZone />}
        </Box>
    );
});

const EmptyQueueDropZone = () => {
    const playerContext = usePlayerContext();

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
