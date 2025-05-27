import clsx from 'clsx';
import { MouseEvent, useState } from 'react';
import { RiHeartFill, RiHeartLine, RiMoreFill, RiPlayFill } from 'react-icons/ri';

import styles from './grid-card-controls.module.css';

import {
    ALBUM_CONTEXT_MENU_ITEMS,
    ARTIST_CONTEXT_MENU_ITEMS,
    PLAYLIST_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGridContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play, PlayQueueAddOptions } from '/@/shared/types/types';

export const GridCardControls = ({
    handleFavorite,
    handlePlayQueueAdd,
    isHovered,
    itemData,
    itemType,
    resetInfiniteLoaderCache,
}: {
    handleFavorite: (options: {
        id: string[];
        isFavorite: boolean;
        itemType: LibraryItem;
        serverId: string;
    }) => void;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    isHovered?: boolean;
    itemData: any;
    itemType: LibraryItem;
    resetInfiniteLoaderCache?: () => void;
}) => {
    const [isFavorite, setIsFavorite] = useState(itemData?.userFavorite);
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (e: MouseEvent<HTMLButtonElement>, playType?: Play) => {
        e.preventDefault();
        e.stopPropagation();

        handlePlayQueueAdd?.({
            byItemType: {
                id: [itemData.id],
                type: itemType,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const handleFavorites = async (e: MouseEvent<HTMLButtonElement>, serverId: string) => {
        e.preventDefault();
        e.stopPropagation();

        handleFavorite?.({
            id: [itemData.id],
            isFavorite: itemData.userFavorite,
            itemType,
            serverId,
        });

        setIsFavorite(!isFavorite);
    };

    const handleContextMenu = useHandleGridContextMenu(
        itemType,
        itemType === LibraryItem.ALBUM
            ? ALBUM_CONTEXT_MENU_ITEMS
            : itemType === LibraryItem.PLAYLIST
              ? PLAYLIST_CONTEXT_MENU_ITEMS
              : ARTIST_CONTEXT_MENU_ITEMS,
        resetInfiniteLoaderCache,
    );

    return (
        <>
            {isFavorite ? <div className={styles.favoriteBanner} /> : null}
            {isHovered && (
                <div className={clsx(styles.gridCardControlsContainer)}>
                    <Button
                        classNames={{ root: styles.playButton }}
                        onClick={handlePlay}
                        variant="filled"
                    >
                        <RiPlayFill size={25} />
                    </Button>
                    <div className={styles.bottomControls}>
                        {itemType !== LibraryItem.PLAYLIST && (
                            <ActionIcon
                                classNames={{ root: styles.secondaryButton }}
                                onClick={(e) => handleFavorites(e, itemData?.serverId)}
                                size="xs"
                                variant="subtle"
                            >
                                <span
                                    className={itemData?.isFavorite ? styles.favoriteWrapper : ''}
                                >
                                    {isFavorite ? (
                                        <RiHeartFill size={20} />
                                    ) : (
                                        <RiHeartLine
                                            color="white"
                                            size={20}
                                        />
                                    )}
                                </span>
                            </ActionIcon>
                        )}
                        <ActionIcon
                            classNames={{ root: styles.secondaryButton }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleContextMenu(e, [itemData]);
                            }}
                            size="xs"
                            variant="subtle"
                        >
                            <RiMoreFill
                                color="white"
                                size={20}
                            />
                        </ActionIcon>
                    </div>
                </div>
            )}
        </>
    );
};
