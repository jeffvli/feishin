import { describe, expect, it } from 'vitest';

import { formatLyrics } from '/@/renderer/features/lyrics/api/lyrics-utils';

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
