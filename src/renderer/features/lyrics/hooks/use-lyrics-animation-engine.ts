import { useCallback, useEffect, useRef } from 'react';

import {
    AnimEngineState,
    buildLyricsDataFromDom,
    BuildLyricsDataOptions,
    createAnimEngineState,
    LyricsData,
    recalculateLinePositions,
    resetAnimEngine,
    resetLyricsAnimationDom,
    resumeLyricsAutoscroll,
    tickLyricsAnimation,
} from '/@/renderer/features/lyrics/hooks/lyrics-animation-engine';
import { SynchronizedLyrics } from '/@/shared/types/domain-types';

export interface UseLyricsAnimationEngineOptions {
    animStateRef?: React.MutableRefObject<AnimEngineState>;
    containerRef: React.RefObject<HTMLElement | null>;
    enabled?: boolean;
    followRef?: React.RefObject<boolean>;
    followScrollAlignmentRef?: React.RefObject<number>;
    fontSize?: number;
    gap?: number;
    lineIdPrefix: 'karaoke-line' | 'lyric';
    lineLeadTimeMsRef?: React.RefObject<number>;
    lyrics: SynchronizedLyrics;
    onLineActive?: (lineIndex: number) => void;
    paddingLeft?: number;
    paddingRight?: number;
    scrollContainerId: string;
}

export const useLyricsAnimationEngine = ({
    animStateRef: externalAnimStateRef,
    containerRef,
    enabled = true,
    followRef,
    followScrollAlignmentRef,
    fontSize,
    gap,
    lineIdPrefix,
    lineLeadTimeMsRef,
    lyrics,
    onLineActive,
    paddingLeft,
    paddingRight,
    scrollContainerId,
}: UseLyricsAnimationEngineOptions) => {
    const internalAnimStateRef = useRef<AnimEngineState>(createAnimEngineState());
    const animStateRef = externalAnimStateRef ?? internalAnimStateRef;
    const lyricsDataRef = useRef<LyricsData | null>(null);
    const onLineActiveRef = useRef(onLineActive);

    useEffect(() => {
        onLineActiveRef.current = onLineActive;
    }, [onLineActive]);

    const rebuildLyricsData = useCallback(() => {
        const container = containerRef.current;
        if (!container || !enabled) {
            lyricsDataRef.current = null;
            return null;
        }

        const options: BuildLyricsDataOptions = {
            container,
            lineIdPrefix,
            lyrics,
        };

        const data = buildLyricsDataFromDom(options);
        lyricsDataRef.current = data;

        if (data) {
            recalculateLinePositions(data);
            animStateRef.current.scroll.wasUserScrolling = true;
        }

        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animStateRef is read via .current at call time
    }, [containerRef, enabled, lineIdPrefix, lyrics]);

    const reset = useCallback(() => {
        resetAnimEngine(animStateRef.current);
        resetLyricsAnimationDom(lyricsDataRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animStateRef is read via .current at call time
    }, []);

    const recalculatePositions = useCallback(() => {
        if (lyricsDataRef.current) {
            recalculateLinePositions(lyricsDataRef.current);
            animStateRef.current.scroll.pendingScroll = true;
            animStateRef.current.scroll.wasUserScrolling = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animStateRef is read via .current at call time
    }, []);

    const tick = useCallback(
        (
            currentTimeMs: number,
            isPlaying: boolean,
            options?: { eventCreationTime?: number; forceResync?: boolean },
        ): number => {
            if (!enabled) {
                return -1;
            }

            let lyricsData = lyricsDataRef.current;
            if (!lyricsData) {
                lyricsData = rebuildLyricsData();
            }

            if (!lyricsData) {
                return -1;
            }

            const scrollContainer =
                document.getElementById(scrollContainerId) ?? containerRef.current ?? undefined;

            if (!scrollContainer) {
                return -1;
            }

            return tickLyricsAnimation(animStateRef.current, {
                currentTimeMs,
                eventCreationTime: options?.eventCreationTime ?? Date.now(),
                follow: followRef?.current ?? true,
                followScrollAlignment: followScrollAlignmentRef?.current ?? 0,
                forceResync: options?.forceResync ?? false,
                isPlaying,
                lineLeadTimeMs: lineLeadTimeMsRef?.current,
                lyricsData,
                onLineActive: onLineActiveRef.current,
                scrollContainer,
                smoothScroll: true,
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animStateRef, containerRef, followRef, lineLeadTimeMsRef are read via .current at call time
        [enabled, rebuildLyricsData, scrollContainerId],
    );

    const resumeAutoscroll = useCallback(() => {
        resumeLyricsAutoscroll(animStateRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- animStateRef is read via .current at call time
    }, []);

    useEffect(() => {
        reset();
        const frame = requestAnimationFrame(() => {
            rebuildLyricsData();
        });

        return () => {
            cancelAnimationFrame(frame);
            reset();
        };
    }, [lyrics, enabled, rebuildLyricsData, reset]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            recalculatePositions();
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [fontSize, gap, paddingLeft, paddingRight, recalculatePositions]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const observedElements = new Set<Element>();

        const observer = new ResizeObserver(() => {
            recalculatePositions();
        });

        const observeLayoutTargets = () => {
            if (!observedElements.has(container)) {
                observer.observe(container);
                observedElements.add(container);
            }

            const content = container.firstElementChild;
            if (content && !observedElements.has(content)) {
                observer.observe(content);
                observedElements.add(content);
            }
        };

        observeLayoutTargets();

        const mutationObserver = new MutationObserver(() => {
            observeLayoutTargets();
        });
        mutationObserver.observe(container, { childList: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [containerRef, recalculatePositions]);

    return {
        animStateRef,
        lyricsDataRef,
        rebuildLyricsData,
        recalculatePositions,
        reset,
        resumeAutoscroll,
        tick,
    };
};
