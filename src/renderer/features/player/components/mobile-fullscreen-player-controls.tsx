import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './mobile-fullscreen-player.module.css';

import { MainPlayButton, PlayerButton } from '/@/renderer/features/player/components/player-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerStatus } from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

interface MobileFullscreenPlayerControlsProps {
    currentSong?: QueueSong;
}

export const MobileFullscreenPlayerControls = memo(
    ({ currentSong }: MobileFullscreenPlayerControlsProps) => {
        const currentSongId = currentSong?.id;
        const { t } = useTranslation();
        const status = usePlayerStatus();
        const {
            mediaNext,
            mediaPrevious,
            mediaSkipBackward,
            mediaSkipForward,
            mediaTogglePlayPause,
        } = usePlayer();

        return (
            <div className={styles.controlsContainer}>
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaPrevious" size="xl" />}
                    onClick={(e) => mediaPrevious(e.altKey)}
                    tooltip={{
                        label: t('player.previous'),
                        openDelay: 0,
                    }}
                    variant="secondary"
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaStepBackward" size="xl" />}
                    onClick={mediaSkipBackward}
                    tooltip={{
                        label: t('player.skip', {
                            context: 'back',
                        }),
                        openDelay: 0,
                    }}
                    variant="tertiary"
                />
                <MainPlayButton
                    disabled={currentSongId === undefined}
                    isPaused={status !== PlayerStatus.PLAYING}
                    onClick={mediaTogglePlayPause}
                    style={{
                        height: '50px',
                        width: '50px',
                    }}
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaStepForward" size="xl" />}
                    onClick={mediaSkipForward}
                    tooltip={{
                        label: t('player.skip', {
                            context: 'forward',
                        }),
                        openDelay: 0,
                    }}
                    variant="tertiary"
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaNext" size="xl" />}
                    onClick={(e) => mediaNext(e.altKey)}
                    tooltip={{
                        label: t('player.next'),
                        openDelay: 0,
                    }}
                    variant="secondary"
                />
            </div>
        );
    },
);

MobileFullscreenPlayerControls.displayName = 'MobileFullscreenPlayerControls';
