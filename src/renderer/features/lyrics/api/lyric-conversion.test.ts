import { describe, expect, it } from 'vitest';

import {
    alignFuriganaToWordCues,
    alignRomajiTokensToWordCues,
} from '/@/renderer/features/lyrics/api/lyric-conversion';

const words = (...texts: string[]) =>
    texts.map((text, index) => ({ endMs: (index + 1) * 1000, startMs: index * 1000, text }));

const ruby = (base: string, reading: string) =>
    `<ruby>${base}<rp>(</rp><rt>${reading}</rt><rp>)</rp></ruby>`;

describe('alignRomajiTokensToWordCues', () => {
    it('gives each word cue the romaji of its tokens and spaces between tokens', () => {
        const tokens = [
            { endChar: 1, romaji: 'kimi', startChar: 0, text: '君' },
            { endChar: 2, romaji: 'no', startChar: 1, text: 'の' },
            { endChar: 3, romaji: 'na', startChar: 2, text: '名' },
            { endChar: 4, romaji: 'wa', startChar: 3, text: 'は' },
        ];

        expect(alignRomajiTokensToWordCues('君の名は', words('君の', '名は'), tokens)).toEqual(
            words('kimi no ', 'na wa'),
        );
    });

    it('splits the romaji of a token spanning several word cues by position', () => {
        const tokens = [{ endChar: 5, romaji: 'konnichiwa', startChar: 0, text: 'こんにちは' }];

        expect(alignRomajiTokensToWordCues('こんにちは', words('こん', 'にちは'), tokens)).toEqual(
            words('konn', 'ichiwa'),
        );
    });

    it('gives up when the word cues do not spell out the line', () => {
        expect(alignRomajiTokensToWordCues('君の名は', words('君の'), [])).toBeNull();
    });
});

describe('alignFuriganaToWordCues', () => {
    const toFurigana = async (text: string) =>
        text === '東京' ? ruby('東京', 'とうきょう') : text;
    const tokens = [
        { endChar: 2, startChar: 0, text: '東京' },
        { endChar: 3, startChar: 2, text: 'へ' },
    ];

    it('keeps whole-token furigana on the word cue that covers the token', async () => {
        expect(
            await alignFuriganaToWordCues('東京へ', words('東京', 'へ'), tokens, toFurigana),
        ).toEqual(words(ruby('東京', 'とうきょう'), 'へ'));
    });

    it('splits the reading per kanji when a token spans several word cues', async () => {
        expect(
            await alignFuriganaToWordCues('東京へ', words('東', '京へ'), tokens, toFurigana),
        ).toEqual(words(ruby('東', 'とう'), `${ruby('京', 'きょう')}へ`));
    });

    it('falls back to the original text when there is no furigana', async () => {
        expect(
            await alignFuriganaToWordCues('東京へ', words('東京', 'へ'), [], toFurigana),
        ).toEqual(words('東京', 'へ'));
        expect(await alignFuriganaToWordCues('東京へ', words('東'), tokens, toFurigana)).toBeNull();
    });
});
