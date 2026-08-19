import isElectron from 'is-electron';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import {
    animateLyricsScrollTo,
    createAnimEngineState,
    handleLyricsUserScroll,
    resumeLyricsAutoscroll,
    shouldSkipLyricsScrollEvent,
} from '/@/renderer/features/lyrics/hooks/lyrics-animation-engine';
import {
    useLyricsDisplaySettings,
    useLyricsSettings,
    usePlaybackType,
    usePlayerActions,
} from '/@/renderer/store';
import { SynchronizedLyrics } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.api.mpris : null;

export const LYRICS_SCROLL_CONTAINER_ID = 'sychronized-lyrics-scroll-container';
export const MANUAL_SCROLL_PAUSE_MS = 2000;
const MANUAL_SCROLL_DRIFT_PX = 3;

export const useSynchronizedLyricsBase = (settingsKey = 'default', offsetMs?: number) => {
    const playbackType = usePlaybackType();
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings(settingsKey);
    const { mediaSeekToTimestamp } = usePlayerActions();

    const settings = useMemo(
        () => ({
            ...lyricsSettings,
            fontSize:
                displaySettings.fontSize && displaySettings.fontSize !== 0
                    ? displaySettings.fontSize
                    : 24,
            gap: displaySettings.gap && displaySettings.gap !== 0 ? displaySettings.gap : 24,
            opacityNonActive: displaySettings.opacityNonActive,
            paddingLeft: displaySettings.paddingLeft ?? 0,
            paddingRight: displaySettings.paddingRight ?? 0,
            scaleNonActive:
                displaySettings.scaleNonActive && displaySettings.scaleNonActive !== 0
                    ? displaySettings.scaleNonActive
                    : 0.95,
        }),
        [displaySettings, lyricsSettings],
    );

    const effectiveOffsetMs = offsetMs ?? 0;
    const delayMsRef = useRef(effectiveOffsetMs);
    const followRef = useRef(settings.follow);
    const followScrollAlignmentRef = useRef(settings.followScrollAlignment);
    const lineLeadTimeMsRef = useRef(settings.lineLeadTimeMs);
    const userScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const programmaticScrollRef = useRef(false);
    const programmaticScrollTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const lyricRef = useRef<null | SynchronizedLyrics>(null);
    const scrollAnimStateRef = useRef(createAnimEngineState());

    const handleSeek = useCallback(
        (time: number) => {
            if (playbackType === PlayerType.LOCAL && mpvPlayer) {
                mpvPlayer.seekTo(time);
            } else {
                mpris?.updateSeek(time);
                mediaSeekToTimestamp(time);
            }
        },
        [mediaSeekToTimestamp, playbackType],
    );

    const handleLineClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            const target = (event.target as HTMLElement).closest('[data-lyric-time]');
            if (!target) {
                return;
            }

            const time = Number((target as HTMLElement).dataset.lyricTime);
            if (time >= 0 && Number.isFinite(time)) {
                handleSeek(time / 1000);
            }
        },
        [handleSeek],
    );

    const scrollToLine = useCallback(
        (_index: number, lineSelector: string, anchorSelector?: string) => {
            const doc = document.getElementById(LYRICS_SCROLL_CONTAINER_ID) as HTMLElement;
            const lineElement = document.querySelector(lineSelector) as HTMLElement | null;
            const anchorElement = anchorSelector
                ? (document.querySelector(anchorSelector) as HTMLElement | null)
                : null;
            const scrollTarget = anchorElement ?? lineElement;

            if (!followRef.current || userScrollingRef.current || !scrollTarget || !doc) {
                return;
            }

            const containerRect = doc.getBoundingClientRect();
            const targetRect = scrollTarget.getBoundingClientRect();
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const containerCenterY = containerRect.top + containerRect.height / 2;
            const scrollTop = doc.scrollTop + targetCenterY - containerCenterY;

            programmaticScrollRef.current = true;
            const durationMs = animateLyricsScrollTo(scrollAnimStateRef.current, doc, scrollTop);

            if (programmaticScrollTimeoutRef.current) {
                clearTimeout(programmaticScrollTimeoutRef.current);
            }

            programmaticScrollTimeoutRef.current = setTimeout(
                () => {
                    programmaticScrollRef.current = false;
                },
                durationMs > 0 ? durationMs + 50 : 150,
            );
        },
        [],
    );

    const resumeAutoscroll = useCallback(() => {
        userScrollingRef.current = false;
        resumeLyricsAutoscroll(scrollAnimStateRef.current);
    }, []);

    const pauseManualScrollFollow = useCallback(() => {
        userScrollingRef.current = true;
        handleLyricsUserScroll(scrollAnimStateRef.current, MANUAL_SCROLL_PAUSE_MS);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            userScrollingRef.current = false;
        }, MANUAL_SCROLL_PAUSE_MS);
    }, []);

    const containerStyle = useMemo(
        () =>
            ({
                '--lyric-opacity': settings.opacityNonActive,
                '--lyric-scale': settings.scaleNonActive,
                '--lyric-scale-origin': settings.alignment,
            }) as React.CSSProperties,
        [settings.alignment, settings.opacityNonActive, settings.scaleNonActive],
    );

    const hideScrollbar = useCallback(() => {
        const doc = document.getElementById(LYRICS_SCROLL_CONTAINER_ID) as HTMLElement;
        doc?.classList.add('hide-scrollbar');
    }, []);

    const showScrollbar = useCallback(() => {
        const doc = document.getElementById(LYRICS_SCROLL_CONTAINER_ID) as HTMLElement;
        doc?.classList.remove('hide-scrollbar');
    }, []);

    useEffect(() => {
        followRef.current = settings.follow;
    }, [settings.follow]);

    useEffect(() => {
        followScrollAlignmentRef.current = settings.followScrollAlignment;
    }, [settings.followScrollAlignment]);

    useEffect(() => {
        lineLeadTimeMsRef.current = settings.lineLeadTimeMs;
    }, [settings.lineLeadTimeMs]);

    useEffect(() => {
        const newOffset = offsetMs ?? 0;
        if (delayMsRef.current === newOffset) {
            return;
        }

        delayMsRef.current = newOffset;
    }, [offsetMs]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaX === 0 && event.deltaY === 0) {
                return;
            }

            pauseManualScrollFollow();
        };

        const handleTouchStart = () => {
            pauseManualScrollFollow();
        };

        const handleScroll = () => {
            const scrollState = scrollAnimStateRef.current.scroll;
            const isProgrammatic = Date.now() < scrollState.programmaticScrollUntil;

            if (
                !isProgrammatic &&
                scrollState.scrollPos >= 0 &&
                Math.abs(container.scrollTop - scrollState.scrollPos) > MANUAL_SCROLL_DRIFT_PX
            ) {
                pauseManualScrollFollow();
                return;
            }

            if (shouldSkipLyricsScrollEvent(scrollAnimStateRef.current)) {
                return;
            }

            if (programmaticScrollRef.current) {
                if (programmaticScrollTimeoutRef.current) {
                    clearTimeout(programmaticScrollTimeoutRef.current);
                }

                programmaticScrollTimeoutRef.current = setTimeout(() => {
                    programmaticScrollRef.current = false;
                }, 150);

                return;
            }

            pauseManualScrollFollow();
        };

        container.addEventListener('wheel', handleWheel, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('scroll', handleScroll);

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            if (programmaticScrollTimeoutRef.current) {
                clearTimeout(programmaticScrollTimeoutRef.current);
            }
        };
    }, [pauseManualScrollFollow]);

    return {
        containerRef,
        containerStyle,
        delayMsRef,
        followRef,
        followScrollAlignmentRef,
        handleLineClick,
        handleSeek,
        hideScrollbar,
        lineLeadTimeMsRef,
        lyricRef,
        resumeAutoscroll,
        scrollAnimStateRef,
        scrollToLine,
        settings,
        showScrollbar,
        userScrollingRef,
    };
};
