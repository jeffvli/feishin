import formatDuration from 'format-duration';

import { PlayerbarSeekSlider } from './playerbar-seek-slider';
import styles from './playerbar-slider.module.css';
import { PlayerbarWaveform } from './playerbar-waveform';

import { useRemote } from '/@/renderer/features/remote/hooks/use-remote';
import {
    useAppStore,
    useAppStoreActions,
    usePlayerSong,
    usePlayerTimestamp,
} from '/@/renderer/store';
import { PlayerbarSliderType, usePlayerbarSlider } from '/@/renderer/store/settings.store';
import { Slider, SliderProps } from '/@/shared/components/slider/slider';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';

export const PlayerbarSlider = () => {
    const currentSong = usePlayerSong();
    const playerbarSlider = usePlayerbarSlider();

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const currentTime = usePlayerTimestamp();

    const formattedDuration = formatDuration(songDuration * 1000 || 0);
    const formattedTimeRemaining = formatDuration((currentTime - songDuration) * 1000 || 0);
    const formattedTime = formatDuration(currentTime * 1000 || 0);

    const { showTimeRemaining } = useAppStore();
    const { setShowTimeRemaining } = useAppStoreActions();

    useRemote();

    const isWaveform = playerbarSlider?.type === PlayerbarSliderType.WAVEFORM;

    return (
        <>
            <div className={styles.sliderContainer}>
                <div className={styles.sliderValueWrapper}>
                    <Text
                        className={PlaybackSelectors.elapsedTime}
                        fw={600}
                        isMuted
                        isNoSelect
                        size="xs"
                        style={{ userSelect: 'none' }}
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
                <div className={styles.sliderValueWrapper}>
                    <Text
                        className={PlaybackSelectors.totalDuration}
                        fw={600}
                        isMuted
                        isNoSelect
                        onClick={() => setShowTimeRemaining(!showTimeRemaining)}
                        role="button"
                        size="xs"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        {showTimeRemaining ? formattedTimeRemaining : formattedDuration}
                    </Text>
                </div>
            </div>
        </>
    );
};

export const CustomPlayerbarSlider = ({ ...props }: SliderProps) => {
    return (
        <Slider
            classNames={{
                bar: styles.bar,
                label: styles.label,
                root: styles.root,
                thumb: styles.thumb,
                track: styles.track,
            }}
            {...props}
            size={6}
        />
    );
};
