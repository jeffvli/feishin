import { describe, expect, it } from 'vitest';

import {
    addIndexesToShuffled,
    adjustShuffledIndexesForInsertion,
    calculateNextIndex,
    calculateNextSong,
    getDualPlayerSongs,
    isShuffleEnabled,
    mapShuffledToQueueIndex,
    regroupUpNextQueue,
    syncUpNextQueue,
} from '/@/renderer/store/player-queue-utils';
import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerShuffle } from '/@/shared/types/types';

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

describe('isShuffleEnabled', () => {
    it.each([
        [PlayerShuffle.TRACK, [1, 0], true],
        [PlayerShuffle.TRACK, [], false],
        [PlayerShuffle.NONE, [1, 0], false],
    ])('shuffle %s with shuffled %j is %s', (shuffle, shuffled, expected) => {
        expect(isShuffleEnabled({ player: { shuffle }, queue: { shuffled } })).toBe(expected);
    });
});

describe('addIndexesToShuffled', () => {
    it('keeps the played part and shuffles new indexes into the rest', () => {
        const result = addIndexesToShuffled([2, 0, 1, 3], 1, [4, 5]);
        expect(result.slice(0, 2)).toEqual([2, 0]);
        expect(result.slice(2).sort()).toEqual([1, 3, 4, 5]);
    });
});

describe('adjustShuffledIndexesForInsertion', () => {
    it('shifts indexes at or after the insert position', () => {
        expect(adjustShuffledIndexesForInsertion([0, 3, 1, 2], 2, 2)).toEqual([0, 5, 1, 4]);
    });
});

const upNextState = ({
    index = 0,
    priority,
    queue = ['a', 'b', 'c', 'd'],
    shuffled = [],
}: {
    index?: number;
    priority: string[];
    queue?: string[];
    shuffled?: number[];
}) => ({
    player: {
        index,
        shuffle: shuffled.length ? PlayerShuffle.TRACK : PlayerShuffle.NONE,
    },
    queue: { default: [...queue], priority, shuffled },
});

describe('syncUpNextQueue', () => {
    it('clears Up Next when the setting is disabled', () => {
        const state = upNextState({ priority: ['c'] });
        syncUpNextQueue(state, false);
        expect(state.queue).toMatchObject({ default: ['a', 'b', 'c', 'd'], priority: [] });
    });

    it('drops the playing song and songs no longer in the queue', () => {
        const state = upNextState({ priority: ['a', 'b', 'x'] });
        syncUpNextQueue(state, true);
        expect(state.queue.priority).toEqual(['b']);
    });

    it('leaves the block in place while it is ahead of the current song', () => {
        const state = upNextState({ priority: ['d'] });
        syncUpNextQueue(state, true);
        expect(state.queue.default).toEqual(['a', 'b', 'c', 'd']);
        expect(state.player.index).toBe(0);
    });

    it('regroups a split block directly after the current song', () => {
        const state = upNextState({ priority: ['b', 'd'] });
        syncUpNextQueue(state, true);
        expect(state.queue.default).toEqual(['a', 'b', 'd', 'c']);
        expect(state.player.index).toBe(0);
    });

    it('moves the block after the current song when a later song plays', () => {
        const state = upNextState({ index: 3, priority: ['b'] });
        syncUpNextQueue(state, true);
        expect(state.queue.default).toEqual(['a', 'c', 'd', 'b']);
        expect(state.player.index).toBe(2);
    });

    it('updates the shuffled play order so Up Next plays next', () => {
        // Play order b, d, a, c with a playing
        const state = upNextState({ index: 2, priority: ['d'], shuffled: [1, 3, 0, 2] });
        syncUpNextQueue(state, true);

        const playOrder = state.queue.shuffled.map((i) => state.queue.default[i]);
        expect(playOrder).toEqual(['b', 'a', 'd', 'c']);
        expect(playOrder[state.player.index]).toBe('a');
    });
});

describe('regroupUpNextQueue', () => {
    it('does nothing without Up Next songs', () => {
        const state = upNextState({ priority: [] });
        regroupUpNextQueue(state, 'a', ['c'], true);
        expect(state.queue.priority).toEqual([]);
    });

    it('adds a song dropped inside the block', () => {
        const state = upNextState({ priority: ['b', 'c'], queue: ['a', 'b', 'c', 'e', 'd'] });
        regroupUpNextQueue(state, 'a', ['e'], true);
        expect(state.queue.priority).toEqual(['b', 'c', 'e']);
    });

    it('removes a song dragged out of the block', () => {
        const state = upNextState({ priority: ['b', 'c'], queue: ['a', 'c', 'd', 'b'] });
        regroupUpNextQueue(state, 'a', ['b'], true);
        expect(state.queue.priority).toEqual(['c']);
    });

    it('adds a song dropped after a queue item pinned above the block', () => {
        const state = upNextState({ priority: ['b', 'c'], queue: ['a', 'x', 'y', 'b', 'c'] });
        regroupUpNextQueue(state, 'a', ['y'], true);
        expect(state.queue.priority).toEqual(['y', 'b', 'c']);
        expect(state.queue.default).toEqual(['a', 'x', 'y', 'b', 'c']);
    });
});
