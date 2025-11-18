import { useWavesurfer } from '@wavesurfer/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import styles from './playerbar-slider.module.css';

import { api } from '/@/renderer/api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    BarAlign,
    useGeneralSettings,
    usePlaybackSettings,
    usePlayerSong,
    usePlayerTimestamp,
    usePrimaryColor,
} from '/@/renderer/store';
import { useColorScheme } from '/@/renderer/themes/use-app-theme';
import { Spinner } from '/@/shared/components/spinner/spinner';

export const PlayerbarWaveform = () => {
    const currentSong = usePlayerSong();
    const { transcode } = usePlaybackSettings();
    const { playerbarSlider } = useGeneralSettings();
    const currentTime = usePlayerTimestamp();
    const containerRef = useRef<HTMLDivElement>(null);
    const { mediaSeekToTimestamp } = usePlayer();
    const [isLoading, setIsLoading] = useState(true);

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;

    // Get the stream URL with transcoding support
    const streamUrl = useMemo(() => {
        if (!currentSong?._serverId || !currentSong?.streamUrl) {
            return null;
        }

        if (!transcode.enabled) {
            return currentSong.streamUrl;
        }

        return api.controller.getTranscodingUrl({
            apiClientProps: {
                serverId: currentSong._serverId,
            },
            query: {
                base: currentSong.streamUrl,
                ...transcode,
            },
        });
    }, [currentSong, transcode]);

    const primaryColor = usePrimaryColor();

    const colorScheme = useColorScheme();

    const waveColor = useMemo(() => {
        return colorScheme === 'dark' ? 'rgba(96, 96, 96, 1)' : 'rgba(96, 96, 96, 1)';
    }, [colorScheme]);

    const cursorColor = useMemo(() => {
        return colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    }, [colorScheme]);

    const { wavesurfer } = useWavesurfer({
        barAlign:
            playerbarSlider?.barAlign === BarAlign.CENTER ? undefined : playerbarSlider?.barAlign,
        barGap: playerbarSlider?.barGap,
        barRadius: playerbarSlider?.barRadius,
        barWidth: playerbarSlider?.barWidth,
        container: containerRef,
        cursorColor,
        cursorWidth: 2,
        fillParent: true,
        height: 18,
        interact: true,
        normalize: false,
        progressColor: primaryColor,
        url: streamUrl || undefined,
        waveColor,
    });

    // Reset loading state when stream URL changes
    useEffect(() => {
        setIsLoading(true);
    }, [streamUrl]);

    // Handle waveform ready state
    useEffect(() => {
        if (!wavesurfer) return;

        const handleReady = () => {
            setIsLoading(false);
        };

        wavesurfer.on('ready', handleReady);

        // Check if already loaded
        if (wavesurfer.getDuration() > 0) {
            setIsLoading(false);
        }

        return () => {
            wavesurfer.un('ready', handleReady);
        };
    }, [wavesurfer]);

    useEffect(() => {
        if (!wavesurfer) return;

        // Ensure waveform never plays - it's just for visualization
        const preventPlay = () => {
            wavesurfer.pause();
        };

        wavesurfer.on('play', preventPlay);

        return () => {
            wavesurfer.un('play', preventPlay);
        };
    }, [wavesurfer]);

    // Handle seeking when user clicks on waveform
    useEffect(() => {
        if (!wavesurfer || !songDuration) return;

        const handleInteraction = () => {
            const seekTime = wavesurfer.getCurrentTime();
            const duration = wavesurfer.getDuration();

            if (duration > 0) {
                mediaSeekToTimestamp(seekTime);
            }
        };

        wavesurfer.on('interaction', handleInteraction);

        return () => {
            wavesurfer.un('interaction', handleInteraction);
        };
    }, [wavesurfer, songDuration, mediaSeekToTimestamp]);

    // Update waveform progress based on player current time
    useEffect(() => {
        if (!wavesurfer || !songDuration) return;

        const duration = wavesurfer.getDuration();
        if (duration > 0 && currentTime >= 0) {
            const ratio = currentTime / duration;
            wavesurfer.seekTo(ratio);
        }
    }, [wavesurfer, currentTime, songDuration]);

    return (
        <div
            className={styles.wavesurferContainer}
            onClick={(e) => {
                e?.stopPropagation();
            }}
            style={{ position: 'relative' }}
        >
            <motion.div
                animate={{ opacity: isLoading ? 0 : 1 }}
                className={styles.waveform}
                initial={{ opacity: 0 }}
                ref={containerRef}
                transition={{ duration: 0.2 }}
            />
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        style={{
                            height: '100%',
                            left: 0,
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <Spinner container />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
