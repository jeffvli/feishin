import formatDuration from 'format-duration';
import { memo } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { PlayerbarWaveform } from '/@/renderer/features/player/components/playerbar-waveform';
import { usePlayerTimestamp } from '/@/renderer/store';
import { PlayerbarSliderType, usePlayerbarSlider } from '/@/renderer/store/settings.store';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { QueueSong } from '/@/shared/types/domain-types';

interface MobileFullscreenPlayerProgressProps {
    currentSong?: QueueSong;
}

export const MobileFullscreenPlayerProgress = memo(
    ({ currentSong }: MobileFullscreenPlayerProgressProps) => {
        const currentTime = usePlayerTimestamp();
        const playerbarSlider = usePlayerbarSlider();
        const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
        const formattedDuration = formatDuration(songDuration * 1000 || 0);
        const formattedTime = formatDuration(currentTime * 1000 || 0);

        const isWaveform = playerbarSlider?.type === PlayerbarSliderType.WAVEFORM;

        return (
            <div className={styles.progressContainer}>
                <div className={styles.timeContainer}>
                    <Text
                        className={PlaybackSelectors.elapsedTime}
                        size="xs"
                        style={{ textAlign: 'right' }}
                    >
                        {formattedTime}
                    </Text>
                </div>
                <div className={styles.sliderWrapper}>
                    {isWaveform ? (
                        <PlayerbarWaveform />
                    ) : (
                        <PlayerbarSeekSlider max={songDuration} min={0} />
                    )}
                </div>
                <div className={styles.timeContainer}>
                    <Text
                        className={PlaybackSelectors.totalDuration}
                        size="xs"
                        style={{ textAlign: 'left' }}
                    >
                        {formattedDuration}
                    </Text>
                </div>
            </div>
        );
    },
);

MobileFullscreenPlayerProgress.displayName = 'MobileFullscreenPlayerProgress';
