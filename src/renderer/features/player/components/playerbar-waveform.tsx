import { useWavesurfer } from '@wavesurfer/react';
import formatDuration from 'format-duration';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CustomPlayerbarSlider } from './playerbar-slider';
import styles from './playerbar-waveform.module.css';

import { useSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    BarAlign,
    usePlaybackSettings,
    usePlayerbarSlider,
    usePlayerSong,
    usePlayerTimestamp,
} from '/@/renderer/store';
import { useAppThemeColors, useColorScheme } from '/@/renderer/themes/use-app-theme';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';

export const PlayerbarWaveform = () => {
    const currentSong = usePlayerSong();
    const { transcode } = usePlaybackSettings();
    const playerbarSlider = usePlayerbarSlider();
    const currentTime = usePlayerTimestamp();
    const containerRef = useRef<HTMLDivElement>(null);
    const { mediaSeekToTimestamp } = usePlayer();
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<null | { x: number; y: number }>(null);
    const [tooltipValue, setTooltipValue] = useState(0);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSeekValueRef = useRef<null | number>(null);
    const containerPositionRef = useRef<DOMRect | null>(null);

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;

    const streamUrl = useSongUrl(currentSong, true, transcode);

    const { color } = useAppThemeColors();
    const primaryColor = (color['--theme-colors-primary'] as string) || 'rgb(53, 116, 252)';

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
        interact: false,
        normalize: false,
        progressColor: primaryColor,
        url: streamUrl || undefined,
        waveColor,
    });

    // Reset loading state when stream URL changes and ensure media is muted
    useEffect(() => {
        setIsLoading(true);
        if (wavesurfer) {
            wavesurfer.setVolume(0);
            const mediaElement = wavesurfer.getMediaElement();
            if (mediaElement) {
                mediaElement.muted = true;
                mediaElement.volume = 0;
            }
        }
    }, [streamUrl, wavesurfer]);

    // Handle waveform ready state
    useEffect(() => {
        if (!wavesurfer) return;

        const handleReady = () => {
            setIsLoading(false);
            const mediaElement = wavesurfer.getMediaElement();
            if (mediaElement) {
                mediaElement.muted = true;
                mediaElement.volume = 0;
            }
        };

        wavesurfer.on('ready', handleReady);

        // Check if already loaded
        if (wavesurfer.getDuration() > 0) {
            setIsLoading(false);
            const mediaElement = wavesurfer.getMediaElement();
            if (mediaElement) {
                mediaElement.muted = true;
                mediaElement.volume = 0;
            }
        }

        return () => {
            wavesurfer.un('ready', handleReady);
        };
    }, [wavesurfer]);

    useEffect(() => {
        if (!wavesurfer) return;

        // Ensure waveform never plays - it's just for visualization
        wavesurfer.setVolume(0);

        const muteMediaElement = () => {
            const mediaElement = wavesurfer.getMediaElement();
            if (mediaElement) {
                mediaElement.muted = true;
                mediaElement.volume = 0;
            }
        };

        muteMediaElement();

        const preventPlay = () => {
            wavesurfer.pause();
            muteMediaElement(); // Ensure it stays muted
        };

        wavesurfer.on('play', preventPlay);

        return () => {
            wavesurfer.un('play', preventPlay);
        };
    }, [wavesurfer]);

    // Handle drag start on waveform
    useEffect(() => {
        if (!wavesurfer || !songDuration || !containerRef.current) return;

        const container = containerRef.current;
        let isDraggingLocal = false;

        const handleMouseDown = (e: MouseEvent) => {
            if (!wavesurfer) return;
            const duration = wavesurfer.getDuration();
            if (duration <= 0) return;

            isDraggingLocal = true;
            setIsDragging(true);

            // Cancel any pending timeout
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = null;
            }

            const rect = container.getBoundingClientRect();
            containerPositionRef.current = rect;
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekTime = ratio * duration;
            lastSeekValueRef.current = seekTime;
            setTooltipPosition({ x: rect.left + clickX, y: rect.top });
            setTooltipValue(seekTime);
            wavesurfer.seekTo(ratio);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingLocal || !wavesurfer) return;

            const duration = wavesurfer.getDuration();
            if (duration <= 0) return;

            const rect = container.getBoundingClientRect();
            containerPositionRef.current = rect;
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekTime = ratio * duration;
            lastSeekValueRef.current = seekTime;
            setTooltipPosition({ x: rect.left + clickX, y: rect.top });
            setTooltipValue(seekTime);
            wavesurfer.seekTo(ratio);
        };

        const handleMouseUp = () => {
            if (!isDraggingLocal || !wavesurfer) return;

            isDraggingLocal = false;
            const duration = wavesurfer.getDuration();
            const seekTime = wavesurfer.getCurrentTime();

            setTooltipPosition(null);

            if (duration > 0 && seekTime >= 0) {
                mediaSeekToTimestamp(seekTime);
                lastSeekValueRef.current = seekTime;

                // Set a fallback timeout to clear dragging state
                seekTimeoutRef.current = setTimeout(() => {
                    setIsDragging(false);
                    lastSeekValueRef.current = null;
                    seekTimeoutRef.current = null;
                }, 1000);
            } else {
                setIsDragging(false);
            }
        };

        // Handle touch events for mobile
        const handleTouchStart = (e: TouchEvent) => {
            if (!wavesurfer) return;
            const duration = wavesurfer.getDuration();
            if (duration <= 0) return;

            isDraggingLocal = true;
            setIsDragging(true);

            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = null;
            }

            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            containerPositionRef.current = rect;
            const clickX = touch.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekTime = ratio * duration;
            lastSeekValueRef.current = seekTime;
            setTooltipPosition({ x: rect.left + clickX, y: rect.top });
            setTooltipValue(seekTime);
            wavesurfer.seekTo(ratio);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDraggingLocal || !wavesurfer) return;
            e.preventDefault();

            const duration = wavesurfer.getDuration();
            if (duration <= 0) return;

            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            containerPositionRef.current = rect;
            const clickX = touch.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const seekTime = ratio * duration;
            lastSeekValueRef.current = seekTime;
            setTooltipPosition({ x: rect.left + clickX, y: rect.top });
            setTooltipValue(seekTime);
            wavesurfer.seekTo(ratio);
        };

        const handleTouchEnd = () => {
            if (!isDraggingLocal || !wavesurfer) return;

            isDraggingLocal = false;
            const duration = wavesurfer.getDuration();
            const seekTime = wavesurfer.getCurrentTime();

            setTooltipPosition(null);

            if (duration > 0 && seekTime >= 0) {
                mediaSeekToTimestamp(seekTime);
                lastSeekValueRef.current = seekTime;

                seekTimeoutRef.current = setTimeout(() => {
                    setIsDragging(false);
                    lastSeekValueRef.current = null;
                    seekTimeoutRef.current = null;
                }, 1000);
            } else {
                setIsDragging(false);
            }
        };

        container.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, [wavesurfer, songDuration, mediaSeekToTimestamp]);

    // Sync dragging state when currentTime catches up to seek value
    useEffect(() => {
        if (isDragging && lastSeekValueRef.current !== null) {
            const timeDiff = Math.abs(currentTime - lastSeekValueRef.current);
            if (timeDiff < 0.5) {
                setIsDragging(false);
                setTooltipPosition(null);
                lastSeekValueRef.current = null;
                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = null;
                }
            }
        }
    }, [currentTime, isDragging]);

    // Update waveform progress based on player current time (only when not dragging)
    useEffect(() => {
        if (!wavesurfer || !songDuration || isDragging) return;

        const duration = wavesurfer.getDuration();
        if (duration > 0 && currentTime >= 0) {
            const ratio = currentTime / duration;
            wavesurfer.seekTo(ratio);
        }
    }, [wavesurfer, currentTime, songDuration, isDragging]);

    // Show disabled slider when there's no current song
    if (!currentSong) {
        return (
            <CustomPlayerbarSlider
                disabled
                max={100}
                min={0}
                onClick={(e) => {
                    e?.stopPropagation();
                }}
                size={6}
                value={0}
                w="100%"
            />
        );
    }

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
            {tooltipPosition && isDragging && (
                <motion.div
                    animate={{ opacity: 1, scale: 1, x: '-50%' }}
                    className={styles.tooltip}
                    initial={{ opacity: 0, scale: 0.8, x: '-50%' }}
                    style={{
                        left: `${tooltipPosition.x}px`,
                        position: 'fixed',
                        top: `${tooltipPosition.y - 40}px`,
                        zIndex: 1000,
                    }}
                    transition={{ duration: 0.15 }}
                >
                    <Text isNoSelect size="md">
                        {formatDuration(tooltipValue * 1000)}
                    </Text>
                </motion.div>
            )}
        </div>
    );
};
