import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import styles from './synchronized-karaoke-lyrics.module.css';

import '/@/renderer/features/lyrics/styles/karaoke-animation.css';
import {
    findOverlayLineByTime,
    getLyricLineStartMs,
    getLyricLineText,
    getOverlayCueLinesForLine,
    normalizeLyrics,
} from '/@/renderer/features/lyrics/api/lyrics-utils';
import { LyricsScrollContent } from '/@/renderer/features/lyrics/components/lyrics-scroll-content';
import { SyncedRomajiLyrics } from '/@/renderer/features/lyrics/hooks/use-furigana-lyrics';
import { useLyricsAnimationEngine } from '/@/renderer/features/lyrics/hooks/use-lyrics-animation-engine';
import {
    LYRICS_SCROLL_CONTAINER_ID,
    useSynchronizedLyricsBase,
} from '/@/renderer/features/lyrics/hooks/use-synchronized-lyrics-base';
import { KaraokeLyricLine } from '/@/renderer/features/lyrics/karaoke-lyric-line';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { subscribePlayerStatus, usePlayerStoreBase } from '/@/renderer/store';
import { subscribePlayerProgress, useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import {
    FullLyricsMetadata,
    LyricAgent,
    SynchronizedLyrics as SynchronizedLyricsData,
} from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export interface SynchronizedKaraokeLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    agents?: LyricAgent[];
    extraOverlayLyrics?: SynchronizedLyricsData[];
    lyrics: SynchronizedLyricsData;
    offsetMs?: number;
    pronunciationLyrics?: null | SynchronizedLyricsData;
    romajiLyrics?: null | SynchronizedLyricsData;
    settingsKey?: string;
    style?: React.CSSProperties;
    syncedRomajiLyrics?: null | SyncedRomajiLyrics;
    translatedLyrics?: null | string;
    translationLyrics?: null | SynchronizedLyricsData;
}

const SEEK_DETECT_THRESHOLD_MS = 500;

export const SynchronizedKaraokeLyrics = ({
    agents,
    artist,
    extraOverlayLyrics,
    lyrics,
    name,
    offsetMs,
    pronunciationLyrics,
    romajiLyrics,
    settingsKey = 'default',
    source,
    style,
    syncedRomajiLyrics,
    translatedLyrics,
    translationLyrics,
}: SynchronizedKaraokeLyricsProps) => {
    const {
        containerRef,
        containerStyle,
        delayMsRef,
        followRef,
        followScrollAlignmentRef,
        handleSeek,
        hideScrollbar,
        lineLeadTimeMsRef,
        lyricRef,
        resumeAutoscroll,
        scrollAnimStateRef,
        settings,
        showScrollbar,
    } = useSynchronizedLyricsBase(settingsKey, offsetMs);

    const normalizedLyrics = useMemo(() => normalizeLyrics(lyrics), [lyrics]);
    const rafRef = useRef<null | number>(null);
    const statusRef = useRef(usePlayerStoreBase.getState().player.status);
    const lastSyncedTimeRef = useRef(0);
    const playbackAnchorRef = useRef({
        // eslint-disable-next-line react-hooks/purity
        eventCreationTime: Date.now(),
        timeMs: useTimestampStoreBase.getState().timestamp * 1000,
    });

    const {
        rebuildLyricsData,
        reset,
        resumeAutoscroll: resumeEngineAutoscroll,
        tick,
    } = useLyricsAnimationEngine({
        animStateRef: scrollAnimStateRef,
        containerRef,
        followRef,
        followScrollAlignmentRef,
        fontSize: settings.fontSize,
        gap: settings.gap,
        lineIdPrefix: 'karaoke-line',
        lineLeadTimeMsRef,
        lyrics: normalizedLyrics,
        paddingLeft: settings.paddingLeft,
        paddingRight: settings.paddingRight,
        scrollContainerId: LYRICS_SCROLL_CONTAINER_ID,
    });

    const handleContainerClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            const wordTarget = (event.target as HTMLElement).closest('[data-word-start]');
            if (wordTarget) {
                const wordStart = Number((wordTarget as HTMLElement).dataset.wordStart);
                if (Number.isFinite(wordStart)) {
                    resumeAutoscroll();
                    resumeEngineAutoscroll();
                    handleSeek(wordStart / 1000);
                }
                return;
            }

            const target = (event.target as HTMLElement).closest('[data-lyric-time]');
            if (!target) {
                return;
            }

            const time = Number((target as HTMLElement).dataset.lyricTime);
            if (time >= 0 && Number.isFinite(time)) {
                resumeAutoscroll();
                resumeEngineAutoscroll();
                handleSeek(time / 1000);
            }
        },
        [handleSeek, resumeAutoscroll, resumeEngineAutoscroll],
    );

    const syncAtTime = useCallback(
        (
            timeInMs: number,
            isPlaying: boolean,
            options?: { eventCreationTime?: number; forceReset?: boolean; forceResync?: boolean },
        ) => {
            if (options?.forceReset) {
                reset();
                rebuildLyricsData();
            }

            tick(timeInMs, isPlaying, {
                eventCreationTime: options?.eventCreationTime ?? Date.now(),
                forceResync: options?.forceResync ?? false,
            });
            const eventCreationTime = options?.eventCreationTime ?? Date.now();
            const interpolatedOffsetMs = isPlaying ? Date.now() - eventCreationTime : 0;
            lastSyncedTimeRef.current = timeInMs + interpolatedOffsetMs;
        },
        [rebuildLyricsData, reset, tick],
    );

    const updatePlaybackAnchor = useCallback((timestampSec: number) => {
        playbackAnchorRef.current = {
            eventCreationTime: Date.now(),
            timeMs: timestampSec * 1000,
        };
    }, []);

    const stopRaf = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const startRaf = useCallback(() => {
        stopRaf();

        const runTick = () => {
            if (statusRef.current !== PlayerStatus.PLAYING) {
                stopRaf();
                return;
            }

            const anchor = playbackAnchorRef.current;
            const timeInMs = anchor.timeMs + delayMsRef.current;

            syncAtTime(timeInMs, true, {
                eventCreationTime: anchor.eventCreationTime,
            });

            rafRef.current = requestAnimationFrame(runTick);
        };

        rafRef.current = requestAnimationFrame(runTick);
    }, [delayMsRef, stopRaf, syncAtTime]);

    const syncFromCurrentTimestamp = useCallback(() => {
        const timestamp = useTimestampStoreBase.getState().timestamp;
        updatePlaybackAnchor(timestamp);
        const isPlaying = statusRef.current === PlayerStatus.PLAYING;
        const timeInMs = timestamp * 1000 + delayMsRef.current;
        syncAtTime(timeInMs, isPlaying, { forceReset: true, forceResync: true });
    }, [delayMsRef, syncAtTime, updatePlaybackAnchor]);

    useEffect(() => {
        lyricRef.current = normalizedLyrics;
        lastSyncedTimeRef.current = 0;

        const frame = requestAnimationFrame(() => {
            rebuildLyricsData();

            if (statusRef.current === PlayerStatus.PLAYING) {
                startRaf();
            } else {
                syncFromCurrentTimestamp();
            }
        });

        return () => {
            cancelAnimationFrame(frame);
            stopRaf();
            reset();
        };
    }, [
        lyricRef,
        normalizedLyrics,
        rebuildLyricsData,
        reset,
        startRaf,
        stopRaf,
        syncFromCurrentTimestamp,
    ]);

    useEffect(() => {
        syncFromCurrentTimestamp();
    }, [offsetMs, syncFromCurrentTimestamp]);

    // Rebuild animation state when async romaji overlay data arrives after initial mount.
    // Without this, overlayParts stay empty until a pause/resume triggers rebuildLyricsData().
    useEffect(() => {
        if (syncedRomajiLyrics == null) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            rebuildLyricsData();

            const timestamp = useTimestampStoreBase.getState().timestamp;
            const isPlaying = statusRef.current === PlayerStatus.PLAYING;
            syncAtTime(timestamp * 1000 + delayMsRef.current, isPlaying, {
                eventCreationTime: playbackAnchorRef.current.eventCreationTime,
                forceReset: true,
                forceResync: true,
            });
        });

        return () => cancelAnimationFrame(frame);
    }, [delayMsRef, rebuildLyricsData, syncAtTime, syncedRomajiLyrics]);

    useEffect(() => {
        statusRef.current = usePlayerStoreBase.getState().player.status;

        const unsubscribe = subscribePlayerStatus(({ status }) => {
            statusRef.current = status;

            if (status !== PlayerStatus.PLAYING) {
                stopRaf();
                syncFromCurrentTimestamp();
                return;
            }

            startRaf();
        });

        return unsubscribe;
    }, [startRaf, stopRaf, syncFromCurrentTimestamp]);

    useEffect(() => {
        const unsubscribe = subscribePlayerProgress(({ timestamp }) => {
            const isPlaying = statusRef.current === PlayerStatus.PLAYING;
            const timeInMs = timestamp * 1000 + delayMsRef.current;
            const previousTimeMs = lastSyncedTimeRef.current;
            const isSeek =
                previousTimeMs > 0 &&
                Math.abs(timeInMs - previousTimeMs) > SEEK_DETECT_THRESHOLD_MS;

            updatePlaybackAnchor(timestamp);

            if (!isPlaying) {
                syncAtTime(timeInMs, false, { forceReset: true, forceResync: true });
                return;
            }

            if (isSeek) {
                resumeAutoscroll();
                resumeEngineAutoscroll();
                syncAtTime(timeInMs, true, {
                    eventCreationTime: playbackAnchorRef.current.eventCreationTime,
                    forceReset: true,
                    forceResync: true,
                });
            }
        });

        return unsubscribe;
    }, [delayMsRef, resumeAutoscroll, resumeEngineAutoscroll, syncAtTime, updatePlaybackAnchor]);

    const getOverlayText = (
        overlayLyrics: null | SynchronizedLyricsData | undefined,
        startMs: number,
        lineIndex: number,
        fallback?: null | string,
    ) => {
        if (overlayLyrics) {
            return findOverlayLineByTime(overlayLyrics, startMs, lineIndex);
        }

        return fallback;
    };

    return (
        <div
            className={clsx(styles.container, 'synchronized-karaoke-lyrics overlay-scrollbar')}
            id={LYRICS_SCROLL_CONTAINER_ID}
            onClick={handleContainerClick}
            onMouseEnter={showScrollbar}
            onMouseLeave={hideScrollbar}
            ref={containerRef}
            style={{ ...containerStyle, ...style }}
        >
            <LyricsScrollContent
                gap={settings.gap}
                paddingLeft={settings.paddingLeft}
                paddingRight={settings.paddingRight}
            >
                {settings.showProvider && source && (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-credit"
                        fontSize={settings.fontSize}
                        text={`${source}`}
                    />
                )}
                {settings.showMatch && (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-credit"
                        fontSize={settings.fontSize}
                        text={`${name} — ${artist}`}
                    />
                )}
                {normalizedLyrics.map((rawLine, idx) => {
                    const lineStartMs = getLyricLineStartMs(rawLine);
                    const pronunciationCueLines = getOverlayCueLinesForLine(
                        pronunciationLyrics,
                        lineStartMs,
                        idx,
                    );
                    const translationCueLines = getOverlayCueLinesForLine(
                        translationLyrics,
                        lineStartMs,
                        idx,
                    );
                    const lineLevelRomaji =
                        syncedRomajiLyrics == null && romajiLyrics?.[idx]
                            ? getLyricLineText(romajiLyrics[idx])
                            : undefined;
                    const pronunciationText = getOverlayText(
                        pronunciationLyrics,
                        lineStartMs,
                        idx,
                        lineLevelRomaji,
                    );
                    const translationText = getOverlayText(
                        translationLyrics,
                        lineStartMs,
                        idx,
                        translatedLyrics?.split('\n')[idx],
                    );
                    const extraOverlays = extraOverlayLyrics?.map((overlayLyrics) => ({
                        cueLines: getOverlayCueLinesForLine(overlayLyrics, lineStartMs, idx),
                        text: getOverlayText(overlayLyrics, lineStartMs, idx),
                    }));

                    if (!rawLine.cueLines?.length) {
                        return (
                            <LyricLine
                                alignment={settings.alignment}
                                className="lyric-line synchronized"
                                data-lyric-time={lineStartMs}
                                fontSize={settings.fontSize}
                                id={`karaoke-line-${idx}`}
                                key={idx}
                                romajiText={pronunciationText}
                                text={getLyricLineText(rawLine)}
                                translatedText={translationText}
                            />
                        );
                    }

                    return (
                        <KaraokeLyricLine
                            agents={agents}
                            alignment={settings.alignment}
                            className="synchronized"
                            cueLines={rawLine.cueLines}
                            data-lyric-time={lineStartMs}
                            extraOverlays={extraOverlays}
                            fontSize={settings.fontSize}
                            id={`karaoke-line-${idx}`}
                            key={idx}
                            lineIndex={idx}
                            pronunciationCueLines={pronunciationCueLines}
                            pronunciationText={pronunciationText}
                            romajiCueLines={
                                syncedRomajiLyrics != null
                                    ? (syncedRomajiLyrics[idx] ?? null)
                                    : undefined
                            }
                            translatedText={translationText}
                            translationCueLines={translationCueLines}
                        />
                    );
                })}
            </LyricsScrollContent>
        </div>
    );
};
