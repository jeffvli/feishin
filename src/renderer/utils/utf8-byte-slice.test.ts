import { describe, expect, it } from 'vitest';

import { sliceUtf8Bytes } from '/@/renderer/utils/utf8-byte-slice';

describe('sliceUtf8Bytes', () => {
    it('slices by inclusive byte offsets', () => {
        expect(sliceUtf8Bytes('hello world', 0, 4)).toBe('hello');
        expect(sliceUtf8Bytes('hello world', 6, 10)).toBe('world');
    });

    it('counts multi-byte characters by their UTF-8 length', () => {
        // ä and ö are 2 bytes each
        expect(sliceUtf8Bytes('häät öisin', 0, 5)).toBe('häät');
        expect(sliceUtf8Bytes('häät öisin', 7, 12)).toBe('öisin');
        // Japanese characters are 3 bytes each
        expect(sliceUtf8Bytes('夜に駆ける', 3, 5)).toBe('に');
        expect(sliceUtf8Bytes('夜に駆ける', 6, 14)).toBe('駆ける');
    });

    it('clamps offsets outside the string', () => {
        expect(sliceUtf8Bytes('abc', -5, 100)).toBe('abc');
    });

    it('returns an empty string for an empty range or input', () => {
        expect(sliceUtf8Bytes('abc', 2, 1)).toBe('');
        expect(sliceUtf8Bytes('', 0, 0)).toBe('');
    });
});
