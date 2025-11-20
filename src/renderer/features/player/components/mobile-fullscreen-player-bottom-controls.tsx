import { memo, MouseEvent } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerRepeat, usePlayerShuffle } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { PlayerRepeat, PlayerShuffle } from '/@/shared/types/types';

interface MobileFullscreenPlayerBottomControlsProps {
    isLyricsActive: boolean;
    isQueueActive: boolean;
    onToggleContextMenu: (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
    onToggleLyrics: () => void;
    onToggleQueue: () => void;
}

export const MobileFullscreenPlayerBottomControls = memo(
    ({
        isLyricsActive,
        isQueueActive,
        onToggleContextMenu,
        onToggleLyrics,
        onToggleQueue,
    }: MobileFullscreenPlayerBottomControlsProps) => {
        const repeat = usePlayerRepeat();
        const shuffle = usePlayerShuffle();
        const { toggleRepeat, toggleShuffle } = usePlayer();

        return (
            <div className={styles.bottomControlsBar}>
                <Group className={styles.bottomControlsGroup} gap={0}>
                    <ActionIcon
                        className={styles.bottomControlIcon}
                        icon="mediaShuffle"
                        iconProps={{
                            fill: shuffle === PlayerShuffle.NONE ? 'default' : 'primary',
                            size: 'xl',
                        }}
                        onClick={toggleShuffle}
                        variant="transparent"
                    />
                    <ActionIcon
                        className={styles.bottomControlIcon}
                        icon={repeat === PlayerRepeat.ONE ? 'mediaRepeatOne' : 'mediaRepeat'}
                        iconProps={{
                            fill: repeat === PlayerRepeat.NONE ? 'default' : 'primary',
                            size: 'xl',
                        }}
                        onClick={toggleRepeat}
                        variant="transparent"
                    />
                    <ActionIcon
                        className={styles.bottomControlIcon}
                        icon="queue"
                        iconProps={{
                            fill: isQueueActive ? 'primary' : undefined,
                            size: 'xl',
                        }}
                        onClick={onToggleQueue}
                        variant="transparent"
                    />
                    <ActionIcon
                        className={styles.bottomControlIcon}
                        icon="metadata"
                        iconProps={{
                            fill: isLyricsActive ? 'primary' : undefined,
                            size: 'xl',
                        }}
                        onClick={onToggleLyrics}
                        variant="transparent"
                    />
                    <ActionIcon
                        className={styles.bottomControlIcon}
                        icon="ellipsisVertical"
                        iconProps={{
                            size: 'xl',
                        }}
                        onClick={onToggleContextMenu}
                        variant="transparent"
                    />
                </Group>
            </div>
        );
    },
);

MobileFullscreenPlayerBottomControls.displayName = 'MobileFullscreenPlayerBottomControls';
