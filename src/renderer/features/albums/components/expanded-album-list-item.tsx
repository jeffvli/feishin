import { useMergedRef } from '@mantine/hooks';
import { useSuspenseQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import formatDuration from 'format-duration';
import { motion } from 'motion/react';
import { Fragment, Suspense, useCallback, useRef } from 'react';

import styles from './expanded-album-list-item.module.css';

import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItem,
    useItemListState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Separator } from '/@/shared/components/separator/separator';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { DragOperation, DragTarget, DragTargetMap } from '/@/shared/types/drag-and-drop';

interface AlbumTracksTableProps {
    isDark?: boolean;
    serverId: string;
    songs?: Array<{
        discNumber: number;
        duration: number;
        id: string;
        name: string;
        trackNumber: number;
    }>;
}

interface ExpandedAlbumListItemProps {
    item: ItemListStateItem;
}

interface TrackRowProps {
    controls: ReturnType<typeof useDefaultItemListControls>;
    internalState: ItemListStateActions;
    serverId: string;
    song: NonNullable<AlbumTracksTableProps['songs']>[0];
}

const TrackRow = ({ controls, internalState, serverId, song }: TrackRowProps) => {
    const rowId = internalState.extractRowId(song);
    const isSelected = rowId ? internalState.isSelected(rowId) : false;

    const songWithMetadata = {
        ...song,
        _serverId: serverId,
        itemType: LibraryItem.SONG,
    } as unknown as ItemListItem;

    const {
        isDraggedOver,
        isDragging: isDraggingLocal,
        ref: dragRef,
    } = useDragDrop<HTMLDivElement>({
        drag: {
            getId: () => {
                const draggedItems = getDraggedItems(
                    songWithMetadata as unknown as Song,
                    internalState,
                );
                return draggedItems.map((draggedItem) => draggedItem.id);
            },
            getItem: () => {
                const draggedItems = getDraggedItems(
                    songWithMetadata as unknown as Song,
                    internalState,
                );
                return draggedItems;
            },
            itemType: LibraryItem.SONG,
            onDragStart: () => {
                const draggedItems = getDraggedItems(
                    songWithMetadata as unknown as Song,
                    internalState,
                );
                internalState.setDragging(draggedItems);
            },
            onDrop: () => {
                internalState.setDragging([]);
            },
            operation: [DragOperation.ADD],
            target: DragTargetMap[LibraryItem.SONG] || DragTarget.GENERIC,
        },
        isEnabled: true,
    });

    const isDragging = internalState.isDragging(song.id) || isDraggingLocal;

    const containerRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergedRef(containerRef, dragRef);

    return (
        <Text
            className={clsx(styles['track-row'], {
                [styles.dragging]: isDragging,
                [styles.rowSelected]: isSelected,
                [styles['dragged-over-bottom']]: isDraggedOver === 'bottom',
                [styles['dragged-over-top']]: isDraggedOver === 'top',
            })}
            onClick={(e) =>
                controls.onClick?.({
                    event: e,
                    internalState,
                    item: songWithMetadata,
                    itemType: LibraryItem.SONG,
                })
            }
            ref={mergedRef}
            size="sm"
        >
            <span className={styles['track-number']}>
                {song.discNumber} - {song.trackNumber}
            </span>
            <span className={styles['track-name']}>{song.name}</span>
            <span className={styles['track-duration']}>{formatDuration(song.duration)}</span>
        </Text>
    );
};

const AlbumTracksTable = ({ isDark, serverId, songs }: AlbumTracksTableProps) => {
    const getDataFn = useCallback(() => songs || [], [songs]);

    const extractRowId = useCallback((item: unknown) => {
        if (item && typeof item === 'object' && 'id' in item) {
            return (item as { id: string }).id;
        }
        return undefined;
    }, []);

    const internalState = useItemListState(getDataFn, extractRowId);

    const controls = useDefaultItemListControls();

    return (
        <div className={clsx(styles.tracks, { [styles.dark]: isDark })}>
            <ScrollArea>
                <div className={styles['tracks-list']}>
                    {songs?.map((song) => (
                        <TrackRow
                            controls={controls}
                            internalState={internalState}
                            key={song.id}
                            serverId={serverId}
                            song={song}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export const ExpandedAlbumListItem = ({ item }: ExpandedAlbumListItemProps) => {
    const { data, isLoading } = useSuspenseQuery(
        albumQueries.detail({
            query: { id: item.id },
            serverId: item._serverId,
        }),
    );

    const color = useFastAverageColor({
        algorithm: 'sqrt',
        id: item.id,
        src: data?.imageUrl,
        srcLoaded: true,
    });

    if (color.isLoading) {
        return null;
    }

    return (
        <motion.div
            animate={{
                opacity: 1,
            }}
            className={styles.container}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            style={{ backgroundColor: color.background }}
        >
            {isLoading && (
                <div className={styles.loading}>
                    <Spinner />
                </div>
            )}
            <Suspense>
                <div className={styles.expanded}>
                    <div className={styles.content}>
                        <div className={styles.header}>
                            <TextTitle
                                className={clsx(styles.itemTitle, { [styles.dark]: color.isDark })}
                                fw={700}
                                order={4}
                            >
                                {data?.name}
                            </TextTitle>
                            <Group
                                className={clsx(styles.itemSubtitle, {
                                    [styles.dark]: color.isDark,
                                })}
                                gap="xs"
                            >
                                {data?.albumArtists.map((artist, index) => (
                                    <Fragment key={artist.id}>
                                        <Text
                                            className={clsx(styles.itemSubtitle, {
                                                [styles.dark]: color.isDark,
                                            })}
                                        >
                                            {artist.name}
                                        </Text>
                                        {index < data?.albumArtists.length - 1 && <Separator />}
                                    </Fragment>
                                ))}
                            </Group>
                        </div>
                        <AlbumTracksTable
                            isDark={color.isDark}
                            serverId={item._serverId}
                            songs={data?.songs}
                        />
                    </div>
                    <div className={styles.imageContainer}>
                        <div
                            className={styles.backgroundImage}
                            style={{
                                ['--bg-color' as string]: color?.background,
                                backgroundImage: `url(${data?.imageUrl})`,
                            }}
                        />
                    </div>
                </div>
            </Suspense>
        </motion.div>
    );
};
