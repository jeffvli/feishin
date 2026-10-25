import { describe, expect, it } from 'vitest';

import {
    formatDurationString,
    formatDurationStringShort,
    formatSizeString,
} from '/@/renderer/utils/format';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatDurationString', () => {
    it.each([
        [0, '0s'],
        [59 * SECOND, '59s'],
        [HOUR + 2 * MINUTE + 5 * SECOND, '1h 2m 5s'],
        [DAY + HOUR + MINUTE + SECOND, '1d 1h 1m 1s'],
    ])('formats %i ms as %j', (duration, expected) => {
        expect(formatDurationString(duration)).toBe(expected);
    });
});

describe('formatDurationStringShort', () => {
    it.each([
        [MINUTE + 5 * SECOND, '1m 05s'],
        [HOUR + 2 * MINUTE + 5 * SECOND, '1h 02m'],
        [DAY + HOUR + MINUTE + SECOND, '1d 01h'],
    ])('formats %i ms as %j, keeping the two largest units', (duration, expected) => {
        expect(formatDurationStringShort(duration)).toBe(expected);
    });
});

describe('formatSizeString', () => {
    it.each([
        [undefined, '0.00 B'],
        [500, '500.00 B'],
        [1536, '1.50 KiB'],
        [1.5 * 1024 ** 3, '1.50 GiB'],
        [2.25 * 1024 ** 4, '2.25 TiB'],
    ])('formats %j bytes as %j', (size, expected) => {
        expect(formatSizeString(size)).toBe(expected);
    });
});
