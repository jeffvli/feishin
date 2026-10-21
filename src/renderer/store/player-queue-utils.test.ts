import { describe, expect, it } from 'vitest';

import {
    calculateNextIndex,
    calculateNextSong,
    getDualPlayerSongs,
    mapShuffledToQueueIndex,
} from '/@/renderer/store/player-queue-utils';
import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerRepeat } from '/@/shared/types/types';

const songs = ['a', 'b', 'c'].map((id) => ({ id }) as QueueSong);
const [a, b, c] = songs;

describe('calculateNextSong', () => {
    it('returns undefined for an empty queue', () => {
        expect(calculateNextSong(0, [], PlayerRepeat.ALL)).toBeUndefined();
    });

    it('advances to the next song', () => {
        expect(calculateNextSong(0, songs, PlayerRepeat.NONE)).toBe(b);
        expect(calculateNextSong(0, songs, PlayerRepeat.ALL)).toBe(b);
    });

    it('stops at the end when repeat is off', () => {
        expect(calculateNextSong(2, songs, PlayerRepeat.NONE)).toBeUndefined();
    });

    it('wraps to the start when repeating all', () => {
        expect(calculateNextSong(2, songs, PlayerRepeat.ALL)).toBe(a);
    });

    it('repeats the current song when repeating one', () => {
        expect(calculateNextSong(1, songs, PlayerRepeat.ONE)).toBe(b);
    });
});

describe('calculateNextIndex', () => {
    it.each([
        [0, PlayerRepeat.NONE, { nextIndex: 1, shouldStop: false }],
        [2, PlayerRepeat.NONE, { nextIndex: 0, shouldStop: true }],
        [2, PlayerRepeat.ALL, { nextIndex: 0, shouldStop: false }],
        [1, PlayerRepeat.ONE, { nextIndex: 1, shouldStop: false }],
    ])('index %i with repeat %s', (current, repeat, expected) => {
        expect(calculateNextIndex(current, songs.length, repeat)).toEqual(expected);
    });
});

describe('getDualPlayerSongs', () => {
    it('preloads the next song on the inactive player', () => {
        expect(getDualPlayerSongs(1, a, b, PlayerRepeat.NONE)).toEqual({ player1: a, player2: b });
        expect(getDualPlayerSongs(2, a, b, PlayerRepeat.NONE)).toEqual({ player1: b, player2: a });
    });

    it('leaves the inactive player empty when repeating one', () => {
        expect(getDualPlayerSongs(2, c, a, PlayerRepeat.ONE)).toEqual({
            player1: undefined,
            player2: c,
        });
    });
});

describe('mapShuffledToQueueIndex', () => {
    it('maps a shuffled position to its queue index', () => {
        expect(mapShuffledToQueueIndex(1, [2, 0, 1])).toBe(0);
    });

    it('falls back to the given index when out of range', () => {
        expect(mapShuffledToQueueIndex(5, [2, 0, 1])).toBe(5);
        expect(mapShuffledToQueueIndex(-1, [2, 0, 1])).toBe(-1);
    });
});
