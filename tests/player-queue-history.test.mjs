import assert from 'node:assert/strict';
import test from 'node:test';

import { restorePreviousConsumedId } from '../src/renderer/store/player-queue-history.ts';

test('restores the latest consumed track above the current queue', () => {
    const restored = restorePreviousConsumedId(
        ['current', 'next'],
        [],
        ['older', 'previous'],
        new Set(['current', 'next', 'older', 'previous']),
        false,
    );

    assert.deepEqual(restored, {
        consumedIds: ['older'],
        defaultIds: ['previous', 'current', 'next'],
        restoredId: 'previous',
        shuffledIndexes: [],
    });
});

test('restores shuffled history at the top without changing the remaining order', () => {
    const restored = restorePreviousConsumedId(
        ['current', 'later', 'next'],
        [0, 2, 1],
        ['previous'],
        new Set(['current', 'later', 'next', 'previous']),
        true,
    );

    assert.deepEqual(restored, {
        consumedIds: [],
        defaultIds: ['previous', 'current', 'later', 'next'],
        restoredId: 'previous',
        shuffledIndexes: [0, 1, 3, 2],
    });
});

test('discards unavailable history instead of restoring an invalid track', () => {
    const restored = restorePreviousConsumedId(
        ['current', 'next'],
        [],
        ['available', 'deleted'],
        new Set(['available', 'current', 'next']),
        false,
    );

    assert.deepEqual(restored, {
        consumedIds: [],
        defaultIds: ['available', 'current', 'next'],
        restoredId: 'available',
        shuffledIndexes: [],
    });
});
