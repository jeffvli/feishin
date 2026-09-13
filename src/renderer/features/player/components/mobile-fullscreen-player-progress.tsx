import formatDuration from 'format-duration';
import { lazy, memo, Suspense } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { useIsRadioActive } from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlayerTimestamp } from '/@/renderer/store';
import { PlayerbarSliderType, usePlayerbarSlider } from '/@/renderer/store/settings.store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { QueueSong } from '/@/shared/types/domain-types';

const PlayerbarWaveform = lazy(() =>
    import('/@/renderer/features/player/components/playerbar-waveform').then((module) => ({
        default: module.PlayerbarWaveform,
    })),
);

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

        const isRadioActive = useIsRadioActive();
        const isWaveform = playerbarSlider?.type === PlayerbarSliderType.WAVEFORM;

        if (isRadioActive) {
            return <></>;
        }

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
                    {isWaveform && (
                        <Suspense fallback={<Spinner />}>
                            <PlayerbarWaveform />
                        </Suspense>
                    )}
                    <PlayerbarSeekSlider max={songDuration} min={0} />
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
