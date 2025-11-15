import formatDuration from 'format-duration';
import { useEffect, useRef, useState } from 'react';

import styles from './playerbar-slider.module.css';

import { MpvPlayer } from '/@/renderer/features/player/audio-player/mpv-player';
import { WebPlayer } from '/@/renderer/features/player/audio-player/web-player';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useRemote } from '/@/renderer/features/remote/hooks/use-remote';
import {
    useAppStore,
    useAppStoreActions,
    usePlaybackType,
    usePlayerSong,
    usePlayerTimestamp,
} from '/@/renderer/store';
import { Slider, SliderProps } from '/@/shared/components/slider/slider';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { PlayerType } from '/@/shared/types/types';

export const PlayerbarSlider = ({ ...props }: SliderProps) => {
    const playbackType = usePlaybackType();
    const currentSong = usePlayerSong();

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const currentTime = usePlayerTimestamp();
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const formattedDuration = formatDuration(songDuration * 1000 || 0);
    const formattedTimeRemaining = formatDuration((currentTime - songDuration) * 1000 || 0);
    const formattedTime = formatDuration(currentTime * 1000 || 0);

    const { showTimeRemaining } = useAppStore();
    const { setShowTimeRemaining } = useAppStoreActions();

    const { mediaSeekToTimestamp } = usePlayer();

    const handleSeekToTimestamp = (timestamp: number) => {
        mediaSeekToTimestamp(timestamp);
    };

    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

    useRemote();

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
                    <CustomPlayerbarSlider
                        {...props}
                        label={(value) => formatDuration(value * 1000)}
                        max={songDuration}
                        min={0}
                        onChange={(e) => {
                            // Cancel any pending timeout if user starts seeking again
                            if (seekTimeoutRef.current) {
                                clearTimeout(seekTimeoutRef.current);
                                seekTimeoutRef.current = null;
                            }
                            setIsSeeking(true);
                            setSeekValue(e);
                        }}
                        onChangeEnd={(e) => {
                            setSeekValue(e);
                            handleSeekToTimestamp(e);

                            // Delay resetting isSeeking to allow currentTime to catch up
                            // This prevents the slider from flickering back and forth
                            seekTimeoutRef.current = setTimeout(() => {
                                setIsSeeking(false);
                                seekTimeoutRef.current = null;
                            }, 300);
                        }}
                        onClick={(e) => {
                            e?.stopPropagation();
                        }}
                        size={6}
                        value={!isSeeking ? currentTime : seekValue}
                        w="100%"
                    />
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
            {playbackType === PlayerType.WEB && <WebPlayer />}
            {playbackType === PlayerType.LOCAL && <MpvPlayer />}
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
