import { describe, expect, it } from 'vitest';

import { shuffle, shuffleInPlace } from '/@/renderer/utils/shuffle';

const items = Array.from({ length: 50 }, (_, i) => i);

describe('shuffle', () => {
    it('returns a permutation without changing the input', () => {
        const input = [...items];
        const result = shuffle(input);

        expect(result).not.toBe(input);
        expect(input).toEqual(items);
        expect([...result].sort((a, b) => a - b)).toEqual(items);
    });

    it('changes the order', () => {
        // 50! orders, so an unchanged result means the shuffle is broken
        expect(shuffle(items)).not.toEqual(items);
    });

    it('shuffles in place and returns the same array', () => {
        const input = [...items];
        expect(shuffleInPlace(input)).toBe(input);
        expect([...input].sort((a, b) => a - b)).toEqual(items);
    });

    it('handles empty and single-item arrays', () => {
        expect(shuffle([])).toEqual([]);
        expect(shuffle(['a'])).toEqual(['a']);
    });
});
