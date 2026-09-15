import formatDuration from 'format-duration';
import { motion } from 'motion/react';
import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from 'react';

import styles from './playerbar-waveform.module.css';
import { RgbWaveformData } from './rgb-waveform';
import { getCachedRgbWaveform, loadRgbWaveform } from './rgb-waveform-cache';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    BarAlign,
    usePlaybackSettings,
    usePlayerbarSlider,
    usePlayerSong,
    usePlayerTimestamp,
} from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';

export const PlayerbarWaveform = () => {
    const currentSong = usePlayerSong();
    const playerbarSlider = usePlayerbarSlider();
    const currentTime = usePlayerTimestamp();
    const { transcode } = usePlaybackSettings();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentSongRef = useRef(currentSong);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const transcodeRef = useRef(transcode);
    const { mediaSeekToTimestamp } = usePlayer();
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [previewTime, setPreviewTime] = useState<null | number>(null);
    const [tooltipPosition, setTooltipPosition] = useState<null | { x: number; y: number }>(null);
    const [waveform, setWaveform] = useState<null | RgbWaveformData>(null);

    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const displayTime = previewTime ?? currentTime;
    const progress = songDuration ? Math.max(0, Math.min(1, displayTime / songDuration)) : 0;

    currentSongRef.current = currentSong;
    transcodeRef.current = transcode;

    useEffect(() => {
        let cancelled = false;
        const song = currentSongRef.current;
        const cachedWaveform = getCachedRgbWaveform(song);
        setIsLoading(!cachedWaveform);
        setWaveform(null);

        const showWaveform = (analysis: RgbWaveformData) => {
            window.requestAnimationFrame(() => {
                if (cancelled) return;
                setWaveform(analysis);
                setIsLoading(false);
            });
        };

        const loadWaveform = async () => {
            if (!song) return;

            if (cachedWaveform) {
                showWaveform(cachedWaveform);
                return;
            }

            await new Promise<void>((resolve) => {
                window.setTimeout(
                    resolve,
                    playerbarSlider?.loadingDelay ? playerbarSlider.loadingDelay * 1000 : 2000,
                );
            });
            if (cancelled) return;

            try {
                showWaveform(await loadRgbWaveform(song, transcodeRef.current));
            } catch (error) {
                if (cancelled) return;
                logger.warn('RGB waveform analysis failed', { error: String(error) });
                setIsLoading(false);
            }
        };

        void loadWaveform();

        return () => {
            cancelled = true;
        };
    }, [currentSong?._uniqueId, playerbarSlider?.loadingDelay, transcode.enabled]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !waveform) return;

        const draw = () => {
            const { height, width } = canvas.getBoundingClientRect();
            if (!height || !width) return;

            const pixelRatio = window.devicePixelRatio || 1;
            canvas.height = Math.round(height * pixelRatio);
            canvas.width = Math.round(width * pixelRatio);

            const context = canvas.getContext('2d');
            if (!context) return;
            context.scale(pixelRatio, pixelRatio);

            const barWidth = Math.max(1, playerbarSlider.barWidth || 1);
            const barGap = Math.max(0, playerbarSlider.barGap || 0);
            const barStep = barWidth + barGap;
            const barCount = Math.max(1, Math.ceil(width / barStep));
            const pointsPerBar = waveform.amplitude.length / barCount;
            const amplitudeScale = playerbarSlider.stretched
                ? Math.max(waveform.maxAmplitude, 0.001)
                : 1;

            for (let bar = 0; bar < barCount; bar += 1) {
                const start = Math.floor(bar * pointsPerBar);
                const end = Math.max(start + 1, Math.ceil((bar + 1) * pointsPerBar));
                let amplitude = 0;
                let low = 0;
                let mid = 0;
                let high = 0;

                for (
                    let point = start;
                    point < end && point < waveform.amplitude.length;
                    point += 1
                ) {
                    amplitude = Math.max(amplitude, waveform.amplitude[point]);
                    low = Math.max(low, waveform.low[point]);
                    mid = Math.max(mid, waveform.mid[point]);
                    high = Math.max(high, waveform.high[point]);
                }

                const dominantBand = Math.max(low, mid, high, 0.001);
                const red = Math.round(255 * Math.sqrt(low / dominantBand));
                const green = Math.round(255 * Math.sqrt(mid / dominantBand));
                const blue = Math.round(255 * Math.sqrt(high / dominantBand));
                const renderedHeight = Math.max(
                    1,
                    Math.min(height, (amplitude / amplitudeScale) * height),
                );
                const y =
                    playerbarSlider.barAlign === BarAlign.TOP
                        ? 0
                        : playerbarSlider.barAlign === BarAlign.BOTTOM
                          ? height - renderedHeight
                          : (height - renderedHeight) / 2;

                context.fillStyle = `rgb(${red} ${green} ${blue})`;
                context.beginPath();
                context.roundRect(
                    bar * barStep,
                    y,
                    barWidth,
                    renderedHeight,
                    Math.min(playerbarSlider.barRadius, barWidth / 2, renderedHeight / 2),
                );
                context.fill();
            }
        };

        draw();
        const resizeObserver = new ResizeObserver(draw);
        resizeObserver.observe(canvas);
        return () => resizeObserver.disconnect();
    }, [playerbarSlider, waveform]);

    useEffect(() => {
        if (isDragging || previewTime === null) return;
        if (Math.abs(currentTime - previewTime) < 0.5) {
            setPreviewTime(null);
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = null;
            }
        }
    }, [currentTime, isDragging, previewTime]);

    useEffect(() => {
        return () => {
            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        };
    }, []);

    const getPointerTime = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const offset = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        setTooltipPosition({ x: rect.left + offset, y: rect.top });
        return rect.width ? (offset / rect.width) * songDuration : 0;
    };

    const commitSeek = (time: number) => {
        const clampedTime = Math.max(0, Math.min(songDuration, time));
        setPreviewTime(clampedTime);
        mediaSeekToTimestamp(clampedTime);
        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = setTimeout(() => {
            setPreviewTime(null);
            seekTimeoutRef.current = null;
        }, 1000);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const keyTargets: Record<string, number> = {
            ArrowLeft: displayTime - 5,
            ArrowRight: displayTime + 5,
            End: songDuration,
            Home: 0,
        };
        const target = keyTargets[event.key];
        if (target === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        commitSeek(target);
    };

    if (!currentSong) return null;

    return (
        <div className={styles.wavesurferContainer}>
            {isLoading && !waveform && (
                <div aria-label="Loading waveform" className={styles.loadingSpinner} role="status">
                    <Spinner size="sm" />
                </div>
            )}
            <motion.div
                animate={{ opacity: waveform ? 1 : 0 }}
                aria-busy={isLoading}
                aria-label="Track waveform"
                aria-valuemax={songDuration}
                aria-valuemin={0}
                aria-valuenow={displayTime}
                aria-valuetext={formatDuration(displayTime * 1000)}
                className={styles.waveform}
                initial={{ opacity: 0 }}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleKeyDown}
                onPointerCancel={() => {
                    setIsDragging(false);
                    setTooltipPosition(null);
                }}
                onPointerDown={(event) => {
                    if (!waveform || !songDuration) return;
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const time = getPointerTime(event);
                    setIsDragging(true);
                    setPreviewTime(time);
                }}
                onPointerMove={(event) => {
                    if (!isDragging) return;
                    setPreviewTime(getPointerTime(event));
                }}
                onPointerUp={(event) => {
                    if (!isDragging) return;
                    event.currentTarget.releasePointerCapture(event.pointerId);
                    const time = getPointerTime(event);
                    setIsDragging(false);
                    setTooltipPosition(null);
                    commitSeek(time);
                }}
                role="slider"
                tabIndex={waveform ? 0 : -1}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <canvas className={styles.canvas} ref={canvasRef} />
                {waveform && (
                    <div className={styles.cursor} style={{ left: `${progress * 100}%` }} />
                )}
            </motion.div>
            {tooltipPosition && isDragging && previewTime !== null && (
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
                        {formatDuration(previewTime * 1000)}
                    </Text>
                </motion.div>
            )}
        </div>
    );
};
