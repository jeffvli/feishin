import { describe, expect, it } from 'vitest';

import { idsEqual } from './sync-util';

describe('idsEqual', () => {
    it('treats same-order identical lists as equal', () => {
        expect(idsEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
        expect(idsEqual([], [])).toBe(true);
    });

    it('is order-sensitive', () => {
        expect(idsEqual(['a', 'b'], ['b', 'a'])).toBe(false);
    });

    it('distinguishes different lengths', () => {
        expect(idsEqual(['a'], ['a', 'b'])).toBe(false);
    });
});
