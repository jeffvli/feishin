import clsx from 'clsx';
import { useState } from 'react';

import styles from './image-column.module.css';
import { ItemDetailListCellProps } from './types';
import { useDetailRowPlayControl } from './use-detail-row-play-control';

import i18n from '/@/i18n/i18n';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonBehavior, usePlayerActions } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const ImageColumn = ({
    controls,
    internalState,
    rowIndex = 0,
    song,
}: ItemDetailListCellProps) => {
    const playButtonBehavior = usePlayButtonBehavior();
    const [isHovered, setIsHovered] = useState(false);
    const { isActive, isPlaying } = useDetailRowPlayControl({ internalState, rowIndex, song });
    const { mediaTogglePlayPause } = usePlayerActions();

    const handlePlay = (playType: Play) => {
        if (!song || !controls?.onDoubleClick) {
            return;
        }

        controls.onDoubleClick({
            event: null,
            index: rowIndex,
            internalState,
            item: song,
            itemType: LibraryItem.SONG,
            meta: { playType, singleSongOnly: true },
        });
    };

    return (
        <div
            className={styles.imageContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ItemImage
                className={styles.compactImage}
                containerClassName={styles.compactContainer}
                explicitStatus={song.explicitStatus}
                id={song.imageId}
                itemType={LibraryItem.SONG}
                serverId={song._serverId}
                type="table"
            />
            {isHovered && (
                <div className={clsx(styles.playButtonOverlay)}>
                    <PlayTooltip
                        label={
                            isActive
                                ? i18n.t(isPlaying ? 'player.pause' : 'player.play')
                                : undefined
                        }
                        type={playButtonBehavior}
                    >
                        <PlayButton
                            fill
                            icon={isPlaying ? 'mediaPause' : 'mediaPlay'}
                            onClick={() => {
                                if (isActive) {
                                    mediaTogglePlayPause();
                                    return;
                                }
                                handlePlay(playButtonBehavior);
                            }}
                            onLongPress={() =>
                                handlePlay(LONG_PRESS_PLAY_BEHAVIOR[playButtonBehavior])
                            }
                        />
                    </PlayTooltip>
                </div>
            )}
        </div>
    );
};
