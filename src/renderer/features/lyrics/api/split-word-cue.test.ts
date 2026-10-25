import { describe, expect, it } from 'vitest';

import { splitWordCue, splitWordCues } from '/@/renderer/features/lyrics/api/split-word-cue';

const cue = (text: string, startMs = 1000, endMs = 2000) => ({ endMs, startMs, text });

describe('splitWordCue', () => {
    it.each([
        ['short words', 'hello '],
        ['words with a space inside', 'hello world'],
        ['hyphenated words', 'well-known'],
        ['long words in space-separated scripts', 'supercalifragilistic'],
    ])('keeps %s whole', (_, text) => {
        expect(splitWordCue(cue(text))).toEqual([{ ...cue(text), isWrapAfter: false }]);
    });

    it('splits long CJK cues into evenly timed segments', () => {
        const text = '夜に駆けるよ夜に駆ける';
        const parts = splitWordCue(cue(text, 1000, 2100));

        expect(parts.length).toBeGreaterThan(1);
        expect(parts.map((p) => p.text).join('')).toBe(text);
        expect(parts[0].startMs).toBe(1000);
        expect(parts.at(-1)?.endMs).toBe(2100);
        parts.slice(1).forEach((part, i) => expect(part.startMs).toBe(parts[i].endMs));
        // Allow wrapping between segments, but not after the last one
        expect(parts.map((p) => p.isWrapAfter)).toEqual(parts.map((_, i) => i < parts.length - 1));
    });
});

describe('splitWordCues', () => {
    it('flattens the split cues of every word', () => {
        const words = [cue('hi ', 0, 500), cue('東京特許許可局長', 500, 1300)];
        const parts = splitWordCues(words);

        expect(parts[0]).toEqual({ ...words[0], isWrapAfter: false });
        expect(
            parts
                .slice(1)
                .map((p) => p.text)
                .join(''),
        ).toBe('東京特許許可局長');
    });
});
