import { describe, expect, it } from 'vitest';

import {
    isActivePlayerFilter,
    matchesPlayerFilterValue,
} from '/@/renderer/features/player/utils/player-filters';
import { PlayerFilter } from '/@/renderer/store';

const filter = (
    operator: PlayerFilter['operator'],
    value: PlayerFilter['value'],
    fields: Partial<PlayerFilter> = {},
): PlayerFilter => ({ field: 'name', id: '1', isEnabled: true, operator, value, ...fields });

describe('isActivePlayerFilter', () => {
    it('accepts an enabled filter with a value', () => {
        expect(isActivePlayerFilter(filter('is', 'x'))).toBe(true);
        expect(isActivePlayerFilter(filter('is', 0))).toBe(true);
        expect(isActivePlayerFilter(filter('is', false))).toBe(true);
    });

    it.each([
        ['disabled', filter('is', 'x', { isEnabled: false })],
        ['missing isEnabled', filter('is', 'x', { isEnabled: undefined })],
        ['empty value', filter('is', '')],
        ['null value', filter('is', null as unknown as string)],
    ])('ignores a %s filter', (_, value) => {
        expect(isActivePlayerFilter(value)).toBe(false);
    });
});

describe('matchesPlayerFilterValue', () => {
    it.each([
        ['is', 'Christmas', 'christmas', true],
        ['is', 'Christmas Songs', 'christmas', false],
        ['isNot', 'Rock', 'christmas', true],
        ['contains', 'Last Christmas', 'CHRISTMAS', true],
        ['notContains', 'Last Christmas', 'christmas', false],
        ['startsWith', 'Live at Wembley', 'live', true],
        ['endsWith', 'Song (Live)', '(live)', true],
        ['endsWith', 'Live Song', 'live', false],
    ] as const)('%s: %j vs %j is %s', (operator, songValue, value, expected) => {
        expect(matchesPlayerFilterValue(songValue, filter(operator, value))).toBe(expected);
    });

    it('compares numbers numerically', () => {
        // Durations are in ms; "9" > "10" as strings, but not as numbers
        expect(matchesPlayerFilterValue(9, filter('lt', '10'))).toBe(true);
        expect(matchesPlayerFilterValue(9, filter('gt', '10'))).toBe(false);
        expect(matchesPlayerFilterValue(60_000, filter('lt', 60_000))).toBe(false);
    });

    it('matches booleans by value', () => {
        expect(matchesPlayerFilterValue(true, filter('is', true, { field: 'favorite' }))).toBe(
            true,
        );
        expect(matchesPlayerFilterValue(false, filter('is', true, { field: 'favorite' }))).toBe(
            false,
        );
    });

    it('matches regex case-insensitively', () => {
        expect(matchesPlayerFilterValue('Song (Remix)', filter('regex', '\\(re?mix\\)$'))).toBe(
            true,
        );
        expect(matchesPlayerFilterValue('Remixed Song', filter('regex', '\\(remix\\)$'))).toBe(
            false,
        );
    });

    it('does not match an invalid regex', () => {
        expect(matchesPlayerFilterValue('anything', filter('regex', '('))).toBe(false);
    });

    it('does not match a song without a value for the field', () => {
        expect(matchesPlayerFilterValue(null, filter('isNot', 'x'))).toBe(false);
        expect(matchesPlayerFilterValue(undefined, filter('notContains', 'x'))).toBe(false);
    });
});
