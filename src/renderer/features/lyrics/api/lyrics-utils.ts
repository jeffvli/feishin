import {
    LyricsKind,
    StructuredLyric,
    SyncedCueLine,
    SyncedWordCue,
    SynchronizedLyricLine,
    SynchronizedLyrics,
    SynchronizedLyricsLineTuple,
} from '/@/shared/types/domain-types';

export const isLyricsLineTuple = (
    line: SynchronizedLyricLine | SynchronizedLyricsLineTuple,
): line is SynchronizedLyricsLineTuple => Array.isArray(line);

export const normalizeLyricsLine = (
    line: SynchronizedLyricLine | SynchronizedLyricsLineTuple,
): SynchronizedLyricLine => {
    if (isLyricsLineTuple(line)) {
        return { startMs: line[0], text: line[1] ?? '' };
    }

    return {
        ...line,
        text: line.text ?? '',
    };
};

export const normalizeLyrics = (
    lyrics: SynchronizedLyrics | SynchronizedLyricsLineTuple[],
): SynchronizedLyrics => lyrics.map(normalizeLyricsLine);

export const getLyricLineStartMs = (
    line: SynchronizedLyricLine | SynchronizedLyricsLineTuple,
): number => normalizeLyricsLine(line).startMs;

export const getLyricLineText = (
    line: SynchronizedLyricLine | SynchronizedLyricsLineTuple,
): string => normalizeLyricsLine(line).text ?? '';

export const getCurrentLyricIndex = (lyrics: SynchronizedLyrics, timeInMs: number): number => {
    if (!lyrics.length) {
        return -1;
    }

    let index = -1;
    for (let idx = 0; idx < lyrics.length; idx += 1) {
        if (timeInMs < getLyricLineStartMs(lyrics[idx])) {
            break;
        }
        index = idx;
    }

    return index;
};

export const getCurrentWordIndex = (cueLine: SyncedCueLine, timeInMs: number): number => {
    if (!cueLine.words.length) {
        return -1;
    }

    for (let wordIndex = 0; wordIndex < cueLine.words.length; wordIndex += 1) {
        const word = cueLine.words[wordIndex];
        if (timeInMs >= word.startMs && timeInMs < word.endMs) {
            return wordIndex;
        }
    }

    return -1;
};

export const getWordProgress = (word: SyncedWordCue, timeInMs: number): number => {
    const duration = word.endMs - word.startMs;

    if (duration <= 0) {
        return timeInMs >= word.endMs ? 100 : 0;
    }

    const elapsed = Math.max(0, Math.min(duration, timeInMs - word.startMs));
    return (elapsed / duration) * 100;
};

export const getLineEndMs = (line: SynchronizedLyricLine): number => {
    if (!line.cueLines?.length) {
        return line.startMs;
    }

    let endMs = line.startMs;

    for (const cueLine of line.cueLines) {
        endMs = Math.max(endMs, cueLine.endMs);

        for (const word of cueLine.words) {
            endMs = Math.max(endMs, word.endMs);
        }
    }

    return endMs;
};

export const lyricsHasWordCues = (lyrics: SynchronizedLyrics): boolean =>
    lyrics.some((line) => line.cueLines?.some((cueLine) => cueLine.words.length > 0));

export const findOverlayLineMatchByTime = (
    overlayLyrics: null | SynchronizedLyrics | undefined,
    startMs: number,
    lineIndex?: number,
): SynchronizedLyricLine | undefined => {
    if (!overlayLyrics?.length) {
        return undefined;
    }

    if (lineIndex !== undefined && lineIndex >= 0 && lineIndex < overlayLyrics.length) {
        const indexedLine = normalizeLyricsLine(overlayLyrics[lineIndex]);
        if (indexedLine.startMs <= startMs) {
            return indexedLine;
        }
    }

    let match: SynchronizedLyricLine | undefined;

    for (const rawLine of overlayLyrics) {
        const line = normalizeLyricsLine(rawLine);
        if (line.startMs <= startMs) {
            match = line;
            continue;
        }

        break;
    }

    return match;
};

export const findOverlayLineByTime = (
    overlayLyrics: null | SynchronizedLyrics | undefined,
    startMs: number,
    lineIndex?: number,
): string | undefined => findOverlayLineMatchByTime(overlayLyrics, startMs, lineIndex)?.text;

export const overlayLineHasWordCues = (line: SynchronizedLyricLine | undefined): boolean =>
    !!line?.cueLines?.some((cueLine) => cueLine.words.length > 0);

export const getOverlayCueLinesForLine = (
    overlayLyrics: null | SynchronizedLyrics | undefined,
    mainLineStartMs: number,
    lineIndex?: number,
): null | SyncedCueLine[] => {
    const match = findOverlayLineMatchByTime(overlayLyrics, mainLineStartMs, lineIndex);

    if (!match?.cueLines?.length || !overlayLineHasWordCues(match)) {
        return null;
    }

    return match.cueLines;
};

export type LyricsLayers = {
    main: StructuredLyric[];
    others: StructuredLyric[];
    overlayLayers: StructuredLyric[];
    pronunciation: null | StructuredLyric;
    translation: null | StructuredLyric;
};

const getStructuredKind = (lyric: StructuredLyric): LyricsKind => {
    if (!lyric.synced) {
        return 'main';
    }

    return lyric.kind ?? 'main';
};

export const getLyricsLayers = (local: StructuredLyric[]): LyricsLayers => {
    const main: StructuredLyric[] = [];
    const others: StructuredLyric[] = [];
    const overlayLayers: StructuredLyric[] = [];
    let pronunciation: null | StructuredLyric = null;
    let translation: null | StructuredLyric = null;

    for (const lyric of local) {
        const kind = getStructuredKind(lyric);

        if (kind === 'main') {
            main.push(lyric);
        } else {
            others.push(lyric);

            if (lyric.synced) {
                overlayLayers.push(lyric);
            }
        }

        if (kind === 'translation' && !translation) {
            translation = lyric;
        }

        if (kind === 'pronunciation' && !pronunciation) {
            pronunciation = lyric;
        }
    }

    return { main, others, overlayLayers, pronunciation, translation };
};

export const getDefaultStructuredIndex = (local: StructuredLyric[]): number => {
    const mainIndex = local.findIndex(
        (lyric) => lyric.synced && getStructuredKind(lyric) === 'main',
    );

    return mainIndex >= 0 ? mainIndex : 0;
};

export const getOverlayLayerKey = (lyric: StructuredLyric): string => {
    const kind = getStructuredKind(lyric);
    return `${kind}:${lyric.lang}`;
};

export const formatStructuredLyricLabel = (lyric: StructuredLyric): string => {
    const kind = getStructuredKind(lyric);
    return kind === 'main' ? lyric.lang : `${lyric.lang} (${kind})`;
};
