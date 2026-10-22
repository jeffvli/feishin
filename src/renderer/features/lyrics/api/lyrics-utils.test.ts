import { describe, expect, it } from 'vitest';

import {
    findOverlayLineByTime,
    formatLyrics,
    formatStructuredLyricLabel,
    getCurrentLyricIndex,
    getCurrentWordIndex,
    getDefaultStructuredIndex,
    getLineEndMs,
    getLyricLineText,
    getLyricsLayers,
    getOverlayCueLinesForLine,
    getOverlayLayerKey,
    getWordProgress,
    lyricsHasWordCues,
    normalizeLyrics,
    normalizeLyricsLine,
    overlayLineHasWordCues,
} from '/@/renderer/features/lyrics/api/lyrics-utils';
import {
    LyricsKind,
    StructuredLyric,
    SyncedCueLine,
    SynchronizedLyricLine,
} from '/@/shared/types/domain-types';

describe('formatLyrics', () => {
    it('parses LRC timestamps with centiseconds and milliseconds', () => {
        expect(formatLyrics('[00:01.50] first\n[01:02.345] second')).toEqual([
            { startMs: 1500, text: ' first' },
            { startMs: 62345, text: ' second' },
        ]);
    });

    // Regression: #2546
    it('parses LRC timestamps without fractional seconds', () => {
        expect(formatLyrics('[00:12]line\n[100:00]late')).toEqual([
            { startMs: 12000, text: 'line' },
            { startMs: 6000000, text: 'late' },
        ]);
    });

    it('parses NetEase karaoke format and strips word timings', () => {
        expect(formatLyrics('[1000,2000](1000,500)Hello (1500,500)world .')).toEqual([
            { startMs: 1000, text: 'Hello world.' },
        ]);
    });

    it('returns unsynchronized lyrics unchanged', () => {
        const plain = 'just some words\nno timestamps';
        expect(formatLyrics(plain)).toBe(plain);
    });
});

const lines: SynchronizedLyricLine[] = [
    { startMs: 1000, text: 'first' },
    { startMs: 5000, text: 'second' },
    { startMs: 9000, text: 'third' },
];

describe('normalizeLyricsLine', () => {
    it('converts [ms, text] tuples', () => {
        expect(normalizeLyricsLine([1500, 'line'])).toEqual({ startMs: 1500, text: 'line' });
    });

    it('fills in missing text', () => {
        expect(
            normalizeLyricsLine({
                startMs: 0,
                text: undefined,
            } as unknown as SynchronizedLyricLine),
        ).toEqual({ startMs: 0, text: '' });
    });
});

describe('getCurrentLyricIndex', () => {
    it.each([
        [0, -1],
        [999, -1],
        [1000, 0],
        [4999, 0],
        [5000, 1],
        [60_000, 2],
    ])('at %i ms highlights line %i', (timeMs, expected) => {
        expect(getCurrentLyricIndex(lines, timeMs)).toBe(expected);
    });

    it('returns -1 for no lyrics', () => {
        expect(getCurrentLyricIndex([], 1000)).toBe(-1);
    });
});

const cueLine: SyncedCueLine = {
    endMs: 3000,
    index: 0,
    startMs: 1000,
    value: 'hello world',
    words: [
        { endMs: 1500, startMs: 1000, text: 'hello' },
        { endMs: 3000, startMs: 2000, text: 'world' },
    ],
};

describe('word cues', () => {
    it.each([
        [999, -1],
        [1000, 0],
        [1500, -1],
        [2500, 1],
        [3000, -1],
    ])('at %i ms the current word is %i', (timeMs, expected) => {
        expect(getCurrentWordIndex(cueLine, timeMs)).toBe(expected);
    });

    it('reports word progress as a clamped percentage', () => {
        const word = { endMs: 3000, startMs: 2000, text: 'world' };
        expect(getWordProgress(word, 1000)).toBe(0);
        expect(getWordProgress(word, 2500)).toBe(50);
        expect(getWordProgress(word, 4000)).toBe(100);
    });

    it('handles zero-length words', () => {
        const word = { endMs: 2000, startMs: 2000, text: 'x' };
        expect(getWordProgress(word, 1999)).toBe(0);
        expect(getWordProgress(word, 2000)).toBe(100);
    });

    it('ends a line at its last cue or word', () => {
        expect(getLineEndMs({ startMs: 1000, text: 'x' })).toBe(1000);
        expect(
            getLineEndMs({
                cueLines: [{ ...cueLine, endMs: 2500 }],
                startMs: 1000,
                text: 'hello world',
            }),
        ).toBe(3000);
    });
});

describe('findOverlayLineByTime', () => {
    const translation: SynchronizedLyricLine[] = [
        { startMs: 1000, text: 'eka' },
        { startMs: 5000, text: 'toka' },
    ];

    it('finds the last overlay line starting at or before the time', () => {
        expect(findOverlayLineByTime(translation, 4999)).toBe('eka');
        expect(findOverlayLineByTime(translation, 5000)).toBe('toka');
        expect(findOverlayLineByTime(translation, 999)).toBeUndefined();
        expect(findOverlayLineByTime(null, 5000)).toBeUndefined();
    });

    it('uses the matching line index when it fits', () => {
        expect(findOverlayLineByTime(translation, 6000, 0)).toBe('eka');
        // Index points past the time, so fall back to searching
        expect(findOverlayLineByTime(translation, 2000, 1)).toBe('eka');
    });
});

describe('structured lyric layers', () => {
    const lyric = (lang: string, synced: boolean, kind?: LyricsKind) =>
        ({ kind, lang, synced }) as StructuredLyric;

    const unsynced = lyric('eng', false, 'translation');
    const main = lyric('jpn', true);
    const translation = lyric('eng', true, 'translation');
    const pronunciation = lyric('jpn-Latn', true, 'pronunciation');

    it('splits main lyrics from translation and pronunciation layers', () => {
        expect(getLyricsLayers([unsynced, main, translation, pronunciation])).toEqual({
            main: [unsynced, main],
            others: [translation, pronunciation],
            overlayLayers: [translation, pronunciation],
            pronunciation,
            translation,
        });
    });

    it('defaults to the first synced main lyric', () => {
        expect(getDefaultStructuredIndex([unsynced, translation, main])).toBe(2);
        expect(getDefaultStructuredIndex([translation])).toBe(0);
    });

    it('labels layers by language and kind', () => {
        expect(formatStructuredLyricLabel(main)).toBe('jpn');
        expect(formatStructuredLyricLabel(translation)).toBe('eng (translation)');
        expect(formatStructuredLyricLabel(unsynced)).toBe('eng');
    });
});

describe('lyric line helpers', () => {
    it('normalizes a mix of tuples and line objects', () => {
        expect(normalizeLyrics([[0, 'a'], { startMs: 10, text: 'b' }] as never)).toEqual([
            { startMs: 0, text: 'a' },
            { startMs: 10, text: 'b' },
        ]);
        expect(getLyricLineText([5, 'tuple'])).toBe('tuple');
    });

    it('detects word cues', () => {
        const withWords = { cueLines: [cueLine], startMs: 1000, text: 'hello world' };
        const withoutWords = {
            cueLines: [{ ...cueLine, words: [] }],
            startMs: 1000,
            text: 'hello world',
        };

        expect(lyricsHasWordCues([lines[0], withWords])).toBe(true);
        expect(lyricsHasWordCues([lines[0], withoutWords])).toBe(false);
        expect(overlayLineHasWordCues(withWords)).toBe(true);
        expect(overlayLineHasWordCues(undefined)).toBe(false);
    });

    it('returns overlay cue lines only when the matching line has word cues', () => {
        const overlay: SynchronizedLyricLine[] = [
            { cueLines: [cueLine], startMs: 1000, text: 'hello world' },
            { cueLines: [{ ...cueLine, words: [] }], startMs: 5000, text: 'no words' },
        ];

        expect(getOverlayCueLinesForLine(overlay, 1000)).toEqual([cueLine]);
        expect(getOverlayCueLinesForLine(overlay, 5000)).toBeNull();
        expect(getOverlayCueLinesForLine(null, 1000)).toBeNull();
    });

    it('keys overlay layers by kind and language', () => {
        expect(
            getOverlayLayerKey({
                kind: 'translation',
                lang: 'fin',
                synced: true,
            } as StructuredLyric),
        ).toBe('translation:fin');
        expect(getOverlayLayerKey({ lang: 'eng', synced: false } as StructuredLyric)).toBe(
            'main:eng',
        );
    });
});
