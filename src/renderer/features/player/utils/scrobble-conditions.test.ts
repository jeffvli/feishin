import { describe, expect, it } from 'vitest';

import { checkScrobbleConditions } from '/@/renderer/features/player/utils/scrobble-conditions';

// 200 s song, scrobble at 50% (100 s) or 30 s
const check = (
    minimumMode: 'both' | 'percentage' | 'seconds',
    listenedSec: number,
    songDurationMs = 200_000,
) =>
    checkScrobbleConditions({
        minimumMode,
        scrobbleAtDurationMs: 30_000,
        scrobbleAtPercentage: 50,
        songCompletedDurationMs: listenedSec * 1000,
        songDurationMs,
    });

describe('checkScrobbleConditions', () => {
    it.each([
        ['both', 29, false],
        ['both', 30, true],
        ['percentage', 99, false],
        ['percentage', 100, true],
        ['seconds', 29, false],
        ['seconds', 30, true],
    ] as const)('%s mode after %i s: %s', (mode, listenedSec, expected) => {
        expect(check(mode, listenedSec)).toBe(expected);
    });

    it('scrobbles in both mode when either limit is reached', () => {
        // Short song: percentage reached before the seconds limit
        expect(check('both', 10, 20_000)).toBe(true);
        // Long song: seconds reached before the percentage
        expect(check('both', 30, 3_600_000)).toBe(true);
    });

    it('only counts the seconds limit when the duration is unknown', () => {
        expect(check('percentage', 1000, 0)).toBe(false);
        expect(check('both', 30, 0)).toBe(true);
    });
});
