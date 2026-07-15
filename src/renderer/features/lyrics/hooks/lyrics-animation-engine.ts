import {
    animateScrollTop,
    computeScrollDurationMs,
} from '/@/renderer/features/lyrics/api/lyrics-scroll';
import {
    getLineEndMs,
    getLyricLineStartMs,
    lyricsHasWordCues,
} from '/@/renderer/features/lyrics/api/lyrics-utils';
import { SynchronizedLyrics } from '/@/shared/types/domain-types';

const ANIMATING_CLASS = 'lyrics-word-animating';
const PRE_ANIMATING_CLASS = 'lyrics-word-pre-animating';
const PAUSED_CLASS = 'lyrics-word-paused';
const LINE_ACTIVE_CLASS = 'lyrics-line-active';
const LINE_ANIMATING_CLASS = 'lyrics-line-animating';
const LINE_PRE_ANIMATING_CLASS = 'lyrics-line-pre-animating';

const TIME_JUMP_THRESHOLD = 0.5;
const CENTER_SCROLL_POS_RATIO = 0.5;
const DEFAULT_ENDING_THRESHOLD = 0.5;
const DEFAULT_LINE_LEAD_TIME_MS = 800;
const RICHSYNC_TIMING_OFFSET_MS = 150;
const SYNC_TIMING_OFFSET_MS = 115;
const HIGHLIGHT_DURATION_MULTIPLIER = 1.6;

export interface AnimEngineState {
    lastActiveElements: LineData[];
    lastEventCreationTime: number;
    lastPlayState: boolean;
    lastTime: number;
    scroll: ScrollState;
    selectedElementIndex: number;
}

export interface BuildLyricsDataOptions {
    container: HTMLElement;
    lineIdPrefix: 'karaoke-line' | 'lyric';
    lyrics: SynchronizedLyrics;
}

export interface LineData {
    accumulatedOffsetMs: number;
    animationStartTimeMs: number;
    duration: number;
    element: HTMLElement;
    hasWordCues: boolean;
    height: number;
    isAnimating: boolean;
    isAnimationPlayStatePlaying: boolean;
    isScrolled: boolean;
    isSelected: boolean;
    lastAnimSetupAt: number;
    overlayParts: PartData[];
    parts: PartData[];
    position: number;
    time: number;
}

export interface LyricsData {
    container: HTMLElement;
    lineIdPrefix: 'karaoke-line' | 'lyric';
    lines: LineData[];
    syncType: LyricsSyncType;
}

export type LyricsSyncType = 'none' | 'richsync' | 'synced';

export interface PartData {
    animationStartTimeMs: number;
    duration: number;
    element: HTMLElement;
    isAnimating: boolean;
    time: number;
}

export interface ScrollState {
    cancelScroll: (() => void) | null;
    doneFirstInstantScroll: boolean;
    nextScrollAllowedTime: number;
    pendingScroll: boolean;
    programmaticScrollUntil: number;
    queuedScroll: boolean;
    scrollPos: number;
    scrollResumeTime: number;
    skipScrolls: number;
    skipScrollsDecayTimes: number[];
    wasUserScrolling: boolean;
}

export interface TickOptions {
    currentTimeMs: number;
    eventCreationTime: number;
    follow?: boolean;
    followScrollAlignment?: number;
    forceResync?: boolean;
    isPlaying: boolean;
    lineLeadTimeMs?: number;
    lyricsData: LyricsData;
    onLineActive?: (lineIndex: number) => void;
    scrollContainer: HTMLElement;
    smoothScroll?: boolean;
}

export const getFollowScrollPositionRatio = (followScrollAlignment = 0): number => {
    return Math.min(0.95, Math.max(0.05, CENTER_SCROLL_POS_RATIO + followScrollAlignment / 100));
};

const reflow = (element: HTMLElement): void => {
    void element.offsetHeight;
};

export const createScrollState = (): ScrollState => ({
    cancelScroll: null,
    doneFirstInstantScroll: false,
    nextScrollAllowedTime: 0,
    pendingScroll: false,
    programmaticScrollUntil: 0,
    queuedScroll: false,
    scrollPos: -1,
    scrollResumeTime: 0,
    skipScrolls: 0,
    skipScrollsDecayTimes: [],
    wasUserScrolling: false,
});

export const createAnimEngineState = (): AnimEngineState => ({
    lastActiveElements: [],
    lastEventCreationTime: 0,
    lastPlayState: false,
    lastTime: 0,
    scroll: createScrollState(),
    selectedElementIndex: 0,
});

export const resetAnimEngine = (state: AnimEngineState): void => {
    cancelActiveLyricsScroll(state.scroll);
    state.lastActiveElements = [];
    state.scroll.skipScrollsDecayTimes = [];
    state.scroll.doneFirstInstantScroll = false;
    state.scroll.pendingScroll = false;
    state.scroll.queuedScroll = false;
};

const collectLineParts = (lineElement: HTMLElement): PartData[] => {
    const words = lineElement.querySelectorAll<HTMLElement>(
        '.karaoke-word[data-duration]:not(.karaoke-overlay-word)',
    );

    return Array.from(words).map((element) => ({
        animationStartTimeMs: Number.POSITIVE_INFINITY,
        duration: Number.parseFloat(element.dataset.duration ?? '0'),
        element,
        isAnimating: false,
        time: Number.parseFloat(element.dataset.time ?? '0'),
    }));
};

const collectOverlayParts = (lineElement: HTMLElement): PartData[] => {
    const words = lineElement.querySelectorAll<HTMLElement>('.karaoke-overlay-word[data-duration]');

    return Array.from(words).map((element) => ({
        animationStartTimeMs: Number.POSITIVE_INFINITY,
        duration: Number.parseFloat(element.dataset.duration ?? '0'),
        element,
        isAnimating: false,
        time: Number.parseFloat(element.dataset.time ?? '0'),
    }));
};

const cancelSungAnimationCleanup = (element: HTMLElement): void => {
    const existingTimeout = Number(element.dataset.sungCleanupTimeout);
    if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        delete element.dataset.sungCleanupTimeout;
    }
};

const completeSungVisualCleanup = (element: HTMLElement): void => {
    cancelSungAnimationCleanup(element);
    element.style.removeProperty('--karaoke-swipe-delay');
    element.style.removeProperty('--karaoke-anim-delay');
    element.classList.remove(ANIMATING_CLASS);
    element.classList.remove(PRE_ANIMATING_CLASS);
    element.classList.remove(PAUSED_CLASS);
};

const getRemainingHighlightDurationSec = (
    durationSec: number,
    startTimeSec: number,
    interpolatedTimeSec: number,
): number => {
    const highlightDurationSec = durationSec * HIGHLIGHT_DURATION_MULTIPLIER;
    const elapsedSec = Math.max(0, interpolatedTimeSec - startTimeSec);
    return Math.max(0, highlightDurationSec - elapsedSec);
};

const scheduleSungAnimationCleanup = (
    element: HTMLElement,
    durationSec: number,
    startTimeSec: number,
    interpolatedTimeSec: number,
): void => {
    const remainingSec = getRemainingHighlightDurationSec(
        durationSec,
        startTimeSec,
        interpolatedTimeSec,
    );

    if (remainingSec <= 0.05) {
        completeSungVisualCleanup(element);
        return;
    }

    cancelSungAnimationCleanup(element);

    const timeoutId = window.setTimeout(() => {
        delete element.dataset.sungCleanupTimeout;
        completeSungVisualCleanup(element);
    }, remainingSec * 1000);

    element.dataset.sungCleanupTimeout = String(timeoutId);
};

const clearElementAnimation = (element: HTMLElement): void => {
    cancelSungAnimationCleanup(element);
    element.style.removeProperty('--karaoke-swipe-delay');
    element.style.removeProperty('--karaoke-anim-delay');
    element.classList.remove(ANIMATING_CLASS);
    element.classList.remove(PRE_ANIMATING_CLASS);
    element.classList.remove(PAUSED_CLASS);
};

const clearWordSungState = (part: PartData): void => {
    part.element.classList.remove('sung');
};

const markWordSung = (part: PartData, interpolatedTimeSec: number): void => {
    part.animationStartTimeMs = Number.POSITIVE_INFINITY;
    part.isAnimating = false;
    part.element.classList.add('sung');
    scheduleSungAnimationCleanup(part.element, part.duration, part.time, interpolatedTimeSec);
};

const setupPartAnimation = (part: PartData, interpolatedTimeSec: number, now: number): void => {
    const partTimeDelta = interpolatedTimeSec - part.time;

    part.element.classList.remove(ANIMATING_CLASS);
    part.element.classList.remove(PAUSED_CLASS);
    part.element.style.setProperty(
        '--karaoke-swipe-delay',
        `${-partTimeDelta - part.duration * 0.1}s`,
    );
    part.element.style.setProperty('--karaoke-anim-delay', `${-partTimeDelta}s`);
    part.element.classList.add(PRE_ANIMATING_CLASS);

    reflow(part.element);

    part.element.classList.add(ANIMATING_CLASS);
    part.animationStartTimeMs = now - partTimeDelta * 1000;
    part.isAnimating = true;
};

const animateWordParts = (parts: PartData[], interpolatedTimeSec: number, now: number): void => {
    for (const part of parts) {
        const partEnd = part.time + part.duration;

        if (interpolatedTimeSec >= partEnd) {
            if (!part.element.classList.contains('sung')) {
                markWordSung(part, interpolatedTimeSec);
            }
        } else if (interpolatedTimeSec < part.time) {
            if (part.isAnimating || part.element.classList.contains('sung')) {
                clearPartAnimation(part);
                clearWordSungState(part);
            }
        } else if (!part.isAnimating) {
            setupPartAnimation(part, interpolatedTimeSec, now);
        }
    }
};

const clearWordParts = (parts: PartData[], interpolatedTimeSec: number): void => {
    for (const part of parts) {
        if (interpolatedTimeSec >= part.time + part.duration) {
            markWordSung(part, interpolatedTimeSec);
        } else {
            clearPartAnimation(part);
            clearWordSungState(part);
        }
    }
};

const resumeWordParts = (parts: PartData[]): void => {
    for (const part of parts) {
        part.element.classList.remove(PAUSED_CLASS);
    }
};

const clearLineOverlayState = (lineElement: HTMLElement): void => {
    for (const element of lineElement.querySelectorAll<HTMLElement>('.karaoke-overlay-word')) {
        clearElementAnimation(element);
        element.classList.remove('sung');
    }
};

export const buildLyricsDataFromDom = ({
    container,
    lineIdPrefix,
    lyrics,
}: BuildLyricsDataOptions): LyricsData | null => {
    const hasWordCues = lyricsHasWordCues(lyrics);
    const lines: LineData[] = [];

    for (let index = 0; index < lyrics.length; index += 1) {
        const lineElement = document.getElementById(`${lineIdPrefix}-${index}`);
        if (!lineElement) {
            continue;
        }

        const line = lyrics[index];
        const startMs = getLyricLineStartMs(line);
        const endMs = getLineEndMs(line);
        const durationMs = Math.max(0, endMs - startMs);
        const parts = hasWordCues && line.cueLines?.length ? collectLineParts(lineElement) : [];
        const overlayParts = collectOverlayParts(lineElement);

        lines.push({
            accumulatedOffsetMs: 0,
            animationStartTimeMs: Number.POSITIVE_INFINITY,
            duration: durationMs / 1000,
            element: lineElement,
            hasWordCues: parts.length > 0,
            height: -1,
            isAnimating: false,
            isAnimationPlayStatePlaying: false,
            isScrolled: false,
            isSelected: false,
            lastAnimSetupAt: 0,
            overlayParts,
            parts,
            position: -1,
            time: startMs / 1000,
        });
    }

    if (!lines.length) {
        return null;
    }

    const allZero = lines.every((line) => line.time === 0);
    let syncType: LyricsSyncType = allZero ? 'none' : 'synced';
    if (hasWordCues) {
        syncType = 'richsync';
    }

    return {
        container,
        lineIdPrefix,
        lines,
        syncType,
    };
};

export const recalculateLinePositions = (lyricsData: LyricsData): void => {
    const { container, lines } = lyricsData;
    const containerRect = container.getBoundingClientRect();

    for (const line of lines) {
        const rect = line.element.getBoundingClientRect();
        line.position = rect.top - containerRect.top + container.scrollTop;
        line.height = rect.height;
    }
};

const clearPartAnimation = (part: PartData): void => {
    cancelSungAnimationCleanup(part.element);
    part.element.style.removeProperty('--karaoke-swipe-delay');
    part.element.style.removeProperty('--karaoke-anim-delay');
    part.element.classList.remove(ANIMATING_CLASS);
    part.element.classList.remove(PRE_ANIMATING_CLASS);
    part.element.classList.remove(PAUSED_CLASS);
    part.animationStartTimeMs = Number.POSITIVE_INFINITY;
    part.isAnimating = false;
};

const clearLineAnimation = (line: LineData): void => {
    line.element.style.removeProperty('--karaoke-swipe-delay');
    line.element.style.removeProperty('--karaoke-anim-delay');
    line.element.classList.remove(LINE_ANIMATING_CLASS);
    line.element.classList.remove(LINE_PRE_ANIMATING_CLASS);
    line.element.classList.remove(PAUSED_CLASS);
    line.animationStartTimeMs = Number.POSITIVE_INFINITY;
};

const clearLineKaraokeHighlights = (lineData: LineData, interpolatedTimeSec: number): void => {
    if (lineData.hasWordCues) {
        for (const part of lineData.parts) {
            clearPartAnimation(part);
            clearWordSungState(part);
        }
    } else {
        clearLineAnimation(lineData);
    }

    if (lineData.overlayParts.length) {
        clearWordParts(lineData.overlayParts, interpolatedTimeSec);
    }

    lineData.isSelected = false;
    lineData.isAnimating = false;
    lineData.isAnimationPlayStatePlaying = false;
};

const setupLineAnimation = (line: LineData, interpolatedTimeSec: number, now: number): void => {
    const timeDelta = interpolatedTimeSec - line.time;

    line.element.classList.remove(LINE_ANIMATING_CLASS);
    line.element.classList.remove(PAUSED_CLASS);
    line.element.style.setProperty('--karaoke-swipe-delay', `${-timeDelta - line.duration * 0.1}s`);
    line.element.style.setProperty('--karaoke-anim-delay', `${-timeDelta}s`);
    line.element.classList.add(LINE_PRE_ANIMATING_CLASS);

    reflow(line.element);

    line.element.classList.add(LINE_ANIMATING_CLASS);
    line.animationStartTimeMs = now - timeDelta * 1000;
    line.isAnimating = true;
    line.lastAnimSetupAt = now;
    line.isAnimationPlayStatePlaying = true;
    line.accumulatedOffsetMs = 0;
};

const decaySkipScrolls = (state: ScrollState, now: number): void => {
    let decayCount = 0;

    for (const decayTime of state.skipScrollsDecayTimes) {
        if (decayTime > now) {
            break;
        }
        decayCount += 1;
    }

    if (decayCount > 0) {
        state.skipScrollsDecayTimes = state.skipScrollsDecayTimes.slice(decayCount);
        state.skipScrolls = Math.max(0, state.skipScrolls - decayCount);
    }
};

const cancelActiveLyricsScroll = (ss: ScrollState): void => {
    if (ss.cancelScroll) {
        ss.cancelScroll();
        ss.cancelScroll = null;
    }
};

export const animateLyricsScrollTo = (
    state: AnimEngineState,
    scrollContainer: HTMLElement,
    scrollPos: number,
    smoothScroll = true,
): number => {
    const ss = state.scroll;
    const now = Date.now();
    const scrollTop = scrollContainer.scrollTop;

    cancelActiveLyricsScroll(ss);

    let useSmoothScroll = smoothScroll;
    if (scrollTop === 0 && !ss.doneFirstInstantScroll) {
        useSmoothScroll = false;
        ss.doneFirstInstantScroll = true;
        ss.nextScrollAllowedTime = 0;
    }

    const delta = scrollPos - scrollTop;

    if (useSmoothScroll && Math.abs(delta) > 2) {
        const durationMs = computeScrollDurationMs(delta);
        ss.cancelScroll = animateScrollTop(scrollContainer, scrollPos);
        ss.nextScrollAllowedTime = durationMs + now + 20;
        ss.programmaticScrollUntil = now + durationMs + 50;
        ss.scrollPos = scrollPos;
        ss.skipScrolls += 1;
        ss.skipScrollsDecayTimes.push(now + 2000);
        return durationMs;
    }

    scrollContainer.scrollTop = scrollPos;
    ss.programmaticScrollUntil = now + 100;
    ss.scrollPos = scrollPos;
    ss.skipScrolls += 1;
    ss.skipScrollsDecayTimes.push(now + 2000);
    return 0;
};

const scrollToPosition = (
    state: AnimEngineState,
    scrollContainer: HTMLElement,
    scrollPos: number,
    smoothScroll: boolean,
): void => {
    animateLyricsScrollTo(state, scrollContainer, scrollPos, smoothScroll);
};

export const tickLyricsAnimation = (state: AnimEngineState, opts: TickOptions): number => {
    const now = Date.now();
    const {
        currentTimeMs,
        follow = true,
        forceResync = false,
        isPlaying,
        smoothScroll = true,
    } = opts;
    const { eventCreationTime, lyricsData, onLineActive, scrollContainer } = opts;

    if (currentTimeMs === 0 && !isPlaying) {
        return -1;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const timeJumped =
        forceResync ||
        Math.abs(
            currentTimeSec -
                state.lastTime -
                (eventCreationTime - state.lastEventCreationTime) / 1000,
        ) > TIME_JUMP_THRESHOLD;

    if (timeJumped) {
        cancelActiveLyricsScroll(state.scroll);

        for (const lineData of lyricsData.lines) {
            lineData.isAnimating = false;
            lineData.isSelected = false;
            lineData.isAnimationPlayStatePlaying = false;

            if (lineData.isScrolled) {
                lineData.element.classList.remove(LINE_ACTIVE_CLASS);
                lineData.isScrolled = false;
            }

            if (lineData.hasWordCues) {
                for (const part of lineData.parts) {
                    clearPartAnimation(part);
                    clearWordSungState(part);
                }
            } else {
                clearLineAnimation(lineData);
            }

            if (lineData.overlayParts.length) {
                for (const part of lineData.overlayParts) {
                    clearPartAnimation(part);
                    clearWordSungState(part);
                }
            }
        }

        state.scroll.pendingScroll = true;
    }

    state.lastTime = currentTimeSec;
    state.lastPlayState = isPlaying;
    state.lastEventCreationTime = eventCreationTime;

    const timeOffsetSec = isPlaying ? (now - eventCreationTime) / 1000 : 0;
    const playbackTimeSec = currentTimeSec + timeOffsetSec;

    const timingOffsetMs =
        lyricsData.syncType === 'richsync' ? RICHSYNC_TIMING_OFFSET_MS : SYNC_TIMING_OFFSET_MS;
    const interpolatedTimeSec = playbackTimeSec + timingOffsetMs / 1000;
    const leadTimeSec = (opts.lineLeadTimeMs ?? DEFAULT_LINE_LEAD_TIME_MS) / 1000;

    const { lineIdPrefix, lines, syncType } = lyricsData;
    const isLineSyncMode = lineIdPrefix === 'lyric';
    if (syncType === 'none') {
        return -1;
    }

    const scrollHeight = scrollContainer.getBoundingClientRect().height;
    const activeElems: LineData[] = [];
    let newLyricSelected = timeJumped;
    let activeLineIndex = -1;

    if (!isPlaying) {
        for (const lineData of lines) {
            clearLineKaraokeHighlights(lineData, interpolatedTimeSec);

            if (lineData.isScrolled) {
                lineData.element.classList.remove(LINE_ACTIVE_CLASS);
                lineData.isScrolled = false;
            }
        }
    }

    for (let index = 0; index < lines.length; index += 1) {
        const lineData = lines[index];
        const time = lineData.time;
        const nextTime =
            index + 1 < lines.length ? lines[index + 1].time : Number.POSITIVE_INFINITY;
        const isInLineWindow =
            playbackTimeSec < nextTime || playbackTimeSec < time + lineData.duration;

        const isScrollCandidate = playbackTimeSec >= time - leadTimeSec && isInLineWindow;

        const isVisuallyActive = isLineSyncMode
            ? playbackTimeSec >= time && isInLineWindow
            : isScrollCandidate;

        if (isScrollCandidate) {
            activeElems.push(lineData);
            state.selectedElementIndex = index;
            activeLineIndex = index;

            if (isPlaying && !lineData.isScrolled) {
                newLyricSelected = true;
                state.scroll.pendingScroll = true;
                lineData.isScrolled = true;
                onLineActive?.(index);

                if (!isLineSyncMode) {
                    lineData.element.classList.add(LINE_ACTIVE_CLASS);
                }
            }
        } else if (lineData.isScrolled) {
            lineData.isScrolled = false;

            if (!isLineSyncMode) {
                lineData.element.classList.remove(LINE_ACTIVE_CLASS);
            }
        }

        if (isLineSyncMode) {
            if (isVisuallyActive) {
                lineData.element.classList.add(LINE_ACTIVE_CLASS);
            } else {
                lineData.element.classList.remove(LINE_ACTIVE_CLASS);
            }
        }

        if (!isPlaying) {
            continue;
        }

        if (isLineSyncMode && !lineData.hasWordCues) {
            continue;
        }

        const setUpEarly = 2;
        const effectiveEnd = Math.max(nextTime, time + lineData.duration + 0.05);
        const isLineInRange =
            interpolatedTimeSec + setUpEarly >= time && interpolatedTimeSec < effectiveEnd;

        if (isLineInRange) {
            lineData.isSelected = true;

            if (lineData.hasWordCues) {
                resumeWordParts(lineData.parts);
            } else {
                lineData.element.classList.remove(PAUSED_CLASS);
            }

            if (lineData.overlayParts.length) {
                resumeWordParts(lineData.overlayParts);
            }

            lineData.isAnimationPlayStatePlaying = true;

            if (!lineData.hasWordCues && !lineData.isAnimating) {
                setupLineAnimation(lineData, interpolatedTimeSec, now);
            }

            if (lineData.hasWordCues) {
                animateWordParts(lineData.parts, interpolatedTimeSec, now);
            }

            if (lineData.overlayParts.length) {
                animateWordParts(lineData.overlayParts, interpolatedTimeSec, now);
            }
        } else if (lineData.isSelected) {
            if (lineData.hasWordCues) {
                clearWordParts(lineData.parts, interpolatedTimeSec);
            } else {
                clearLineAnimation(lineData);
            }

            if (lineData.overlayParts.length) {
                clearWordParts(lineData.overlayParts, interpolatedTimeSec);
            }

            lineData.isSelected = false;
            lineData.isAnimating = false;
            lineData.isAnimationPlayStatePlaying = false;
        }
    }

    const ss = state.scroll;
    const scrollPausedByUser = ss.scrollResumeTime >= now;
    const canAutoscroll = follow && !scrollPausedByUser;

    if (canAutoscroll) {
        if (activeElems.length === 0 && lines.length > 0) {
            activeElems.push(lines[0]);
        }

        state.lastActiveElements = activeElems.filter((entry) => playbackTimeSec >= entry.time);

        if (activeElems.length > 0) {
            const scrollPosRatio = getFollowScrollPositionRatio(opts.followScrollAlignment);
            const scrollPosOffset = scrollHeight * scrollPosRatio;
            const lastActive = activeElems[activeElems.length - 1];
            const useLastActiveOnly = newLyricSelected || activeElems.length > 1;
            const scrollLines = useLastActiveOnly ? [lastActive] : activeElems;
            const positions = scrollLines
                .filter(
                    (lineData, index) =>
                        playbackTimeSec <
                            lineData.time + lineData.duration - DEFAULT_ENDING_THRESHOLD ||
                        index === scrollLines.length - 1,
                )
                .map((lineData) => lineData.position + lineData.height / 2);

            if (positions.length > 0 && positions.every((pos) => pos >= 0)) {
                const avgPos = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
                let scrollPos = avgPos - scrollPosOffset;
                scrollPos = Math.min(scrollPos, scrollLines[0].position);
                scrollPos = Math.max(
                    scrollPos,
                    lastActive.position - scrollHeight + lastActive.height,
                );
                scrollPos = Math.min(scrollPos, lastActive.position);
                scrollPos = Math.max(0, scrollPos);

                const shouldScroll =
                    ss.wasUserScrolling || newLyricSelected || ss.queuedScroll || ss.pendingScroll;
                const canScrollNow = now > ss.nextScrollAllowedTime;

                if (shouldScroll) {
                    if (canScrollNow) {
                        ss.queuedScroll = false;
                        ss.pendingScroll = false;
                        scrollToPosition(state, scrollContainer, scrollPos, smoothScroll);
                    } else {
                        ss.queuedScroll = true;
                    }
                }
            }
        }
    }

    decaySkipScrolls(ss, now);

    if (ss.wasUserScrolling && ss.scrollResumeTime < now) {
        ss.wasUserScrolling = false;
        ss.pendingScroll = true;
    }

    return activeLineIndex;
};

export const handleLyricsUserScroll = (state: AnimEngineState, pauseDurationMs = 3000): void => {
    const ss = state.scroll;
    cancelActiveLyricsScroll(ss);
    ss.programmaticScrollUntil = 0;
    ss.skipScrolls = 0;
    ss.skipScrollsDecayTimes = [];
    ss.wasUserScrolling = true;
    ss.scrollResumeTime = Date.now() + pauseDurationMs;
};

export const resumeLyricsAutoscroll = (state: AnimEngineState): void => {
    state.scroll.wasUserScrolling = false;
    state.scroll.scrollResumeTime = 0;
};

export const shouldSkipLyricsScrollEvent = (state: AnimEngineState): boolean => {
    if (Date.now() < state.scroll.programmaticScrollUntil) {
        return true;
    }

    if (state.scroll.skipScrolls > 0) {
        state.scroll.skipScrolls -= 1;
        return true;
    }

    return false;
};

export const resetLyricsAnimationDom = (lyricsData: LyricsData | null): void => {
    if (!lyricsData) {
        return;
    }

    for (const line of lyricsData.lines) {
        line.element.classList.remove(
            LINE_ACTIVE_CLASS,
            LINE_ANIMATING_CLASS,
            LINE_PRE_ANIMATING_CLASS,
            'singing',
            'complete',
        );
        line.isScrolled = false;
        line.isSelected = false;
        line.isAnimating = false;

        for (const part of line.parts) {
            clearPartAnimation(part);
            clearWordSungState(part);
        }

        for (const part of line.overlayParts) {
            clearPartAnimation(part);
            clearWordSungState(part);
        }

        clearLineOverlayState(line.element);
        clearLineAnimation(line);
    }
};
