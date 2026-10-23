import { describe, expect, it } from 'vitest';

import {
    coerceYear,
    parsePartialIsoDate,
    parsePartialIsoDateFromApi,
} from '/@/shared/api/partial-iso-date';

describe('coerceYear', () => {
    it('keeps finite numbers', () => {
        expect(coerceYear(1999)).toBe(1999);
    });

    it.each([null, undefined, NaN, Infinity])('returns null for %s', (value) => {
        expect(coerceYear(value)).toBeNull();
    });
});

describe('parsePartialIsoDate', () => {
    it.each([
        ['2001', { date: '2001', year: 2001 }],
        ['2001-05', { date: '2001-05', year: 2001 }],
        ['2001-05-17', { date: '2001-05-17', year: 2001 }],
        ['  2001-05-17  ', { date: '2001-05-17', year: 2001 }],
    ])('parses %j', (input, expected) => {
        expect(parsePartialIsoDate(input)).toEqual(expected);
    });

    it.each([null, undefined, '', '   ', '01', '2001-5', '2001-05-17T10:00:00Z', 'abcd'])(
        'rejects %j',
        (input) => {
            expect(parsePartialIsoDate(input)).toEqual({ date: null, year: 0 });
        },
    );
});

describe('parsePartialIsoDateFromApi', () => {
    it('uses the date prefix of a full ISO datetime', () => {
        expect(parsePartialIsoDateFromApi('2001-05-17T10:00:00.000Z')).toEqual({
            date: '2001-05-17',
            year: 2001,
        });
    });

    it('passes partial dates through', () => {
        expect(parsePartialIsoDateFromApi('2001')).toEqual({ date: '2001', year: 2001 });
    });

    it('rejects garbage', () => {
        expect(parsePartialIsoDateFromApi('not a date at all')).toEqual({ date: null, year: 0 });
    });
});
