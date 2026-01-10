import clsx from 'clsx';
import { CSSProperties, useState } from 'react';
import { Link } from 'react-router';

import styles from './title-combined-column.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { getTitlePath } from '/@/renderer/components/item-list/helpers/get-title-path';
import {
    ColumnNullFallback,
    ColumnSkeletonVariable,
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { Folder, LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const DefaultTitleCombinedColumn = (props: ItemTableListInnerColumn) => {
    const row: object | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.id;
    const item = props.data[props.rowIndex] as any;
    const internalState = (props as any).internalState;
    const playButtonBehavior = usePlayButtonBehavior();
    const [isHovered, setIsHovered] = useState(false);

    const handlePlay = (playType: Play, event: React.MouseEvent<HTMLButtonElement>) => {
        if (!item) {
            return;
        }

        // For SONG items, use double click behavior
        if (
            (props.itemType === LibraryItem.SONG ||
                props.itemType === LibraryItem.PLAYLIST_SONG ||
                item._itemType === LibraryItem.SONG) &&
            props.controls?.onDoubleClick
        ) {
            // Calculate the index based on rowIndex, accounting for header if enabled
            const isHeaderEnabled = !!props.enableHeader;
            const index = isHeaderEnabled ? props.rowIndex - 1 : props.rowIndex;

            props.controls.onDoubleClick({
                event: null,
                index,
                internalState,
                item,
                itemType: props.itemType,
                meta: {
                    playType,
                },
            });
            return;
        }

        // For other item types, use regular onPlay
        if (!props.controls?.onPlay) {
            return;
        }

        props.controls.onPlay({
            event,
            item,
            itemType: props.itemType,
            playType,
        });
    };

    if (item && 'name' in item && 'imageUrl' in item && 'artists' in item) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const item = props.data[props.rowIndex] as any;
        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer
                className={styles.titleCombined}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <div
                    className={styles.imageContainer}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <ItemImage
                        containerClassName={styles.image}
                        id={item?.imageId}
                        itemType={item?._itemType}
                        src={item?.imageUrl}
                        type="table"
                    />
                    {isHovered && (
                        <div
                            className={clsx(styles.playButtonOverlay, {
                                [styles.compactPlayButtonOverlay]: props.size === 'compact',
                            })}
                        >
                            <PlayTooltip
                                disabled={props.itemType === LibraryItem.QUEUE_SONG}
                                type={playButtonBehavior}
                            >
                                <PlayButton
                                    fill
                                    onClick={(e) => handlePlay(playButtonBehavior, e)}
                                    onLongPress={(e) =>
                                        handlePlay(LONG_PRESS_PLAY_BEHAVIOR[playButtonBehavior], e)
                                    }
                                />
                            </PlayTooltip>
                        </div>
                    )}
                </div>
                <div
                    className={clsx(styles.textContainer, {
                        [styles.compact]: props.size === 'compact',
                    })}
                >
                    <Text className={styles.title} isNoSelect size="md" {...titleLinkProps}>
                        {item.name as string}
                    </Text>
                    <div className={styles.artists}>
                        <JoinedArtists
                            artistName={item.albumArtist}
                            artists={item.albumArtists}
                            linkProps={{ fw: 400, isMuted: true }}
                            rootTextProps={{ fw: 400, isMuted: true, size: 'sm' }}
                        />
                    </div>
                </div>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export const QueueSongTitleCombinedColumn = (props: ItemTableListInnerColumn) => {
    const row: object | undefined = (props.data as (any | undefined)[])[props.rowIndex];

    const song = props.data[props.rowIndex] as QueueSong;
    const item = props.data[props.rowIndex] as any;
    const internalState = (props as any).internalState;
    const playButtonBehavior = usePlayButtonBehavior();
    const [isHovered, setIsHovered] = useState(false);
    const isActive =
        !!props.activeRowId &&
        (props.activeRowId === song?.id || props.activeRowId === song?._uniqueId);

    const handlePlay = (playType: Play, event: React.MouseEvent<HTMLButtonElement>) => {
        if (!item) {
            return;
        }

        // For SONG items, use double click behavior
        if (
            (props.itemType === LibraryItem.SONG ||
                props.itemType === LibraryItem.PLAYLIST_SONG ||
                item._itemType === LibraryItem.SONG) &&
            props.controls?.onDoubleClick
        ) {
            // Calculate the index based on rowIndex, accounting for header if enabled
            const isHeaderEnabled = !!props.enableHeader;
            const index = isHeaderEnabled ? props.rowIndex - 1 : props.rowIndex;

            props.controls.onDoubleClick({
                event: null,
                index,
                internalState,
                item,
                itemType: props.itemType,
                meta: {
                    playType,
                },
            });
            return;
        }

        // For other item types, use regular onPlay
        if (!props.controls?.onPlay) {
            return;
        }

        props.controls.onPlay({
            event,
            item,
            itemType: props.itemType,
            playType,
        });
    };

    if (row && 'name' in row && 'imageUrl' in row && 'artists' in row) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const item = props.data[props.rowIndex] as any;

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
                  to: path,
              }
            : {};

        return (
            <TableColumnContainer
                className={styles.titleCombined}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <div
                    className={styles.imageContainer}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <ItemImage
                        containerClassName={styles.image}
                        id={item?.imageId}
                        itemType={item?._itemType}
                        serverId={item?._serverId}
                        src={item?.imageUrl}
                        type="table"
                    />
                    {isHovered && (
                        <div
                            className={clsx(styles.playButtonOverlay, {
                                [styles.compactPlayButtonOverlay]: props.size === 'compact',
                            })}
                        >
                            <PlayTooltip
                                disabled={props.itemType === LibraryItem.QUEUE_SONG}
                                type={playButtonBehavior}
                            >
                                <PlayButton
                                    fill
                                    onClick={(e) => handlePlay(playButtonBehavior, e)}
                                    onLongPress={(e) =>
                                        handlePlay(LONG_PRESS_PLAY_BEHAVIOR[playButtonBehavior], e)
                                    }
                                />
                            </PlayTooltip>
                        </div>
                    )}
                </div>
                <div
                    className={clsx(styles.textContainer, {
                        [styles.active]: isActive,
                        [styles.compact]: props.size === 'compact',
                    })}
                >
                    <Text
                        className={clsx({
                            [styles.active]: isActive,
                            [styles.title]: true,
                        })}
                        isNoSelect
                        size="md"
                        {...titleLinkProps}
                    >
                        {row.name as string}
                        {song?.trackSubtitle && props.itemType !== LibraryItem.QUEUE_SONG && (
                            <Text
                                className={clsx({
                                    [styles.active]: isActive,
                                })}
                                component="span"
                                isMuted
                                size="sm"
                            >
                                {' ('}
                                {song.trackSubtitle}
                                {')'}
                            </Text>
                        )}
                    </Text>
                    <div className={styles.artists}>
                        <JoinedArtists
                            artistName={item.artistName}
                            artists={item.artists}
                            linkProps={{ fw: 400, isMuted: true }}
                            rootTextProps={{ fw: 400, isMuted: true, size: 'sm' }}
                        />
                    </div>
                </div>
            </TableColumnContainer>
        );
    }

    if ((props.data[props.rowIndex] as unknown as Folder)?._itemType === LibraryItem.FOLDER) {
        const rowHeight = props.getRowHeight(props.rowIndex, props);
        const path = getTitlePath(props.itemType, (props.data[props.rowIndex] as any).id as string);

        const item = props.data[props.rowIndex] as any;
        const textStyles = isActive ? { color: 'var(--theme-colors-primary)' } : {};

        const titleLinkProps = path
            ? {
                  component: Link,
                  isLink: true,
                  state: { item },
                  to: path,
              }
            : {};

        const title = (props.data[props.rowIndex] as unknown as Folder)?.name;

        return (
            <TableColumnContainer
                className={styles.titleCombined}
                containerStyle={{ '--row-height': `${rowHeight}px` } as CSSProperties}
                {...props}
            >
                <Icon className={styles.folderIcon} icon="folder" size="2xl" />
                <Text
                    className={styles.title}
                    isNoSelect
                    size="md"
                    {...titleLinkProps}
                    style={textStyles}
                >
                    {title}
                </Text>
            </TableColumnContainer>
        );
    }

    if (row === null) {
        return <ColumnNullFallback {...props} />;
    }

    return <ColumnSkeletonVariable {...props} />;
};

export const TitleCombinedColumn = (props: ItemTableListInnerColumn) => {
    const { itemType } = props;

    switch (itemType) {
        case LibraryItem.FOLDER:
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG:
            return <QueueSongTitleCombinedColumn {...props} />;
        default:
            return <DefaultTitleCombinedColumn {...props} />;
    }
};
