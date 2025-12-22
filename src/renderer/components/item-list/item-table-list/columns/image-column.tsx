import clsx from 'clsx';
import { useState } from 'react';

import styles from './image-column.module.css';

import {
    ItemTableListInnerColumn,
    TableColumnContainer,
} from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonBehavior } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Folder, LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const ImageColumn = (props: ItemTableListInnerColumn) => {
    const row: string | undefined = (props.data as (any | undefined)[])[props.rowIndex]?.[
        props.columns[props.columnIndex].id
    ];
    const playButtonBehavior = usePlayButtonBehavior();
    const item = props.data[props.rowIndex] as any;
    const internalState = (props as any).internalState;
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

    if (typeof row === 'string') {
        return (
            <TableColumnContainer {...props}>
                <div
                    className={clsx(styles.imageContainer, {
                        [styles.compactImageContainer]: props.size === 'compact',
                    })}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Image
                        containerClassName={clsx({
                            [styles.imageContainerWithAspectRatio]:
                                props.size === 'default' || props.size === 'large',
                        })}
                        src={row}
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
            </TableColumnContainer>
        );
    }

    if ((props.data[props.rowIndex] as unknown as Folder)?._itemType === LibraryItem.FOLDER) {
        return (
            <TableColumnContainer {...props}>
                <Icon className={styles.folderIcon} icon="folder" size="2xl" />
            </TableColumnContainer>
        );
    }

    return (
        <TableColumnContainer {...props}>
            <div
                className={clsx(styles.imageContainer, {
                    [styles.compactImageContainer]: props.size === 'compact',
                })}
            >
                <Skeleton containerClassName={styles.skeleton} />
            </div>
        </TableColumnContainer>
    );
};
