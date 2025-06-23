import type { PlayQueueAddOptions } from '/@/shared/types/types';
import type { MouseEvent } from 'react';

import styles from './card-controls.module.css';

import {
    ALBUM_CONTEXT_MENU_ITEMS,
    ARTIST_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const CardControls = ({
    handlePlayQueueAdd,
    itemData,
    itemType,
}: {
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    itemData: any;
    itemType: LibraryItem;
}) => {
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = (e: MouseEvent<HTMLButtonElement>, playType?: Play) => {
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

    const handleContextMenu = useHandleGeneralContextMenu(
        itemType,
        itemType === LibraryItem.ALBUM ? ALBUM_CONTEXT_MENU_ITEMS : ARTIST_CONTEXT_MENU_ITEMS,
    );

    return (
        <div className={styles.gridCardControlsContainer}>
            <div className={styles.bottomControls}>
                <button
                    className={styles.playButton}
                    onClick={handlePlay}
                >
                    <Icon icon="mediaPlay" />
                </button>
                <Group gap="xs">
                    <Button
                        className={styles.secondaryButton}
                        disabled
                        p={5}
                        style={{ svg: { fill: 'white !important' } }}
                        variant="subtle"
                    >
                        <div className={itemData?.isFavorite ? styles.favoriteWrapper : ''}>
                            {itemData?.isFavorite ? (
                                <Icon icon="favorite" />
                            ) : (
                                <Icon icon="favorite" />
                            )}
                        </div>
                    </Button>
                    <ActionIcon
                        className={styles.secondaryButton}
                        onClick={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleContextMenu(e, [itemData]);
                        }}
                        p={5}
                        style={{ svg: { fill: 'white !important' } }}
                        variant="subtle"
                    >
                        <Icon icon="ellipsisHorizontal" />
                    </ActionIcon>
                </Group>
            </div>
        </div>
    );
};
