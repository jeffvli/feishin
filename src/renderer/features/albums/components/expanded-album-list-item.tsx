import { useSuspenseQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import formatDuration from 'format-duration';
import { motion } from 'motion/react';
import { Fragment, Suspense, useCallback, useRef } from 'react';

import styles from './expanded-album-list-item.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { getDraggedItems } from '/@/renderer/components/item-list/helpers/get-dragged-items';
import { useDefaultItemListControls } from '/@/renderer/components/item-list/helpers/item-list-controls';
import {
    ItemListStateActions,
    ItemListStateItem,
    useItemDraggingState,
    useItemListState,
    useItemSelectionState,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ItemListItem } from '/@/renderer/components/item-list/types';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useDragDrop } from '/@/renderer/hooks/use-drag-drop';
import { useSetGlobalExpanded } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Separator } from '/@/shared/components/separator/separator';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { useMergedRef } from '/@/shared/hooks/use-merged-ref';
import { LibraryItem, RelatedArtist, Song } from '/@/shared/types/domain-types';
import { DragOperation, DragTarget, DragTargetMap } from '/@/shared/types/drag-and-drop';
import { Play } from '/@/shared/types/types';

export interface ExpandedAlbumData {
    _serverId: string;
    albumArtists: RelatedArtist[];
    id: string;
    imageId: null | string;
    name: string;
    songs?: null | Song[];
}

export interface ExpandedAlbumListItemProps {
    album?: ExpandedAlbumData;
    item?: ItemListStateItem;
}

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

interface TrackRowProps {
    controls: ReturnType<typeof useDefaultItemListControls>;
    internalState: ItemListStateActions;
    player: ReturnType<typeof usePlayer>;
    serverId: string;
    song: NonNullable<AlbumTracksTableProps['songs']>[0];
    songs: Song[];
}

const CloseExpandedButton = () => {
    const setGlobalExpanded = useSetGlobalExpanded();
    return (
        <ActionIcon
            className={clsx(styles.closeButton)}
            icon="x"
            iconProps={{
                size: 'xl',
            }}
            onClick={() => setGlobalExpanded(null)}
            radius="50%"
            size="sm"
            variant="default"
        />
    );
};

const TrackRow = ({ controls, internalState, player, serverId, song, songs }: TrackRowProps) => {
    const rowId = internalState.extractRowId(song);
    const isSelected = useItemSelectionState(internalState, rowId);
    const isDraggingState = useItemDraggingState(internalState, rowId);

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

    const isDragging = isDraggingState || isDraggingLocal;

    const containerRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergedRef(containerRef, dragRef);

    const handleDoubleClick = useCallback(() => {
        if (songs && song.id) {
            player.addToQueueByData(songs, Play.NOW, song.id);
        }
    }, [player, songs, song.id]);

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
            onDoubleClick={handleDoubleClick}
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

    // Always use a local state for tracks - tracks are separate entities from albums
    // and need their own selection state. The parentInternalState is for album-level operations.
    const internalState = useItemListState(getDataFn, extractRowId);

    const controls = useDefaultItemListControls();
    const player = usePlayer();

    const fullSongs = songs as Song[] | undefined;

    return (
        <div className={clsx(styles.tracks, { [styles.dark]: isDark })}>
            <ScrollArea>
                <div className={styles['tracks-list']}>
                    {songs?.map((song) => (
                        <TrackRow
                            controls={controls}
                            internalState={internalState}
                            key={song.id}
                            player={player}
                            serverId={serverId}
                            song={song}
                            songs={fullSongs || []}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

interface ExpandedAlbumListItemContentProps {
    albumData: ExpandedAlbumData;
}

const ExpandedAlbumListItemContent = ({ albumData }: ExpandedAlbumListItemContentProps) => {
    const player = usePlayer();

    const imageUrl = useItemImageUrl({
        id: albumData.imageId || undefined,
        itemType: LibraryItem.ALBUM,
        type: 'itemCard',
    });

    const color = useFastAverageColor({
        algorithm: 'sqrt',
        id: albumData.id,
        src: imageUrl,
        srcLoaded: true,
    });

    const handlePlay = useCallback(
        (playType: Play) => {
            if (albumData.songs?.length) {
                player.addToQueueByData(albumData.songs, playType);
            }
        },
        [albumData.songs, player],
    );

    if (color.isLoading) {
        return <Spinner container />;
    }

    const songs = albumData.songs ?? null;

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className={styles.container}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            style={{ backgroundColor: color.background }}
        >
            <div className={styles.expanded}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <TextTitle
                                className={clsx(styles.itemTitle, { [styles.dark]: color.isDark })}
                                fw={700}
                                order={4}
                            >
                                {albumData.name}
                            </TextTitle>
                            <CloseExpandedButton />
                        </div>
                        <Group
                            className={clsx(styles.itemSubtitle, { [styles.dark]: color.isDark })}
                            gap="xs"
                        >
                            {albumData.albumArtists?.map((artist, index) => (
                                <Fragment key={artist.id}>
                                    <Text
                                        className={clsx(styles.itemSubtitle, {
                                            [styles.dark]: color.isDark,
                                        })}
                                    >
                                        {artist.name}
                                    </Text>
                                    {index < (albumData.albumArtists?.length ?? 0) - 1 && (
                                        <Separator />
                                    )}
                                </Fragment>
                            ))}
                        </Group>
                    </div>
                    <AlbumTracksTable
                        isDark={color.isDark}
                        serverId={albumData._serverId}
                        songs={songs ?? undefined}
                    />
                </div>
                <div className={styles.imageContainer}>
                    <div
                        className={styles.backgroundImage}
                        style={{
                            ['--bg-color' as string]: color?.background,
                            backgroundImage: `url(${imageUrl})`,
                        }}
                    />
                    {songs && songs.length > 0 && (
                        <div className={styles.playButtonGroup}>
                            <PlayButtonGroup onPlay={handlePlay} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ExpandedAlbumListItemWithFetch = ({ item }: { item: ItemListStateItem }) => {
    const { data } = useSuspenseQuery(
        albumQueries.detail({
            query: { id: item.id },
            serverId: item._serverId,
        }),
    );

    const albumData: ExpandedAlbumData = {
        _serverId: item._serverId,
        albumArtists: data?.albumArtists ?? [],
        id: item.id,
        imageId: item.imageId ?? data?.imageId ?? null,
        name: data?.name ?? '',
        songs: data?.songs ?? null,
    };

    return <ExpandedAlbumListItemContent albumData={albumData} />;
};

function itemToExpandedAlbumData(
    item: ItemListStateItem & {
        _playlistSongs?: Song[];
        albumArtists?: RelatedArtist[];
        name?: string;
    },
): ExpandedAlbumData | null {
    const songs =
        (item as { songs?: Song[] }).songs ?? (item as { _playlistSongs?: Song[] })._playlistSongs;
    if (songs == null) return null;
    return {
        _serverId: item._serverId,
        albumArtists: item.albumArtists ?? [],
        id: item.id,
        imageId: (item as { imageId?: null | string }).imageId ?? null,
        name: (item as { name?: string }).name ?? '',
        songs,
    };
}

export const ExpandedAlbumListItem = (props: ExpandedAlbumListItemProps) => {
    if (props.album != null) {
        return <ExpandedAlbumListItemContent albumData={props.album} />;
    }

    if (props.item != null) {
        const albumData = itemToExpandedAlbumData(props.item);

        if (albumData != null) {
            return <ExpandedAlbumListItemContent albumData={albumData} />;
        }

        return (
            <Suspense fallback={<Spinner container />}>
                <ExpandedAlbumListItemWithFetch item={props.item} />
            </Suspense>
        );
    }

    return null;
};
