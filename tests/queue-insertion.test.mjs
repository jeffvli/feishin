import assert from 'node:assert/strict';
import test from 'node:test';

import { insertQueueIdsAtTarget } from '../src/renderer/store/player-queue-insertion.ts';

test('a dropped song is inserted above the visible target row', () => {
    assert.deepEqual(
        insertQueueIdsAtTarget(['current', 'second', 'third'], ['dropped'], 'third', 'top'),
        ['current', 'second', 'dropped', 'third'],
    );
});

test('a dropped song is inserted below the visible target row', () => {
    assert.deepEqual(
        insertQueueIdsAtTarget(['current', 'second', 'third'], ['dropped'], 'second', 'bottom'),
        ['current', 'second', 'dropped', 'third'],
    );
});

test('multiple dropped songs retain their source order', () => {
    assert.deepEqual(
        insertQueueIdsAtTarget(
            ['current', 'second', 'third'],
            ['dropped-a', 'dropped-b'],
            'second',
            'bottom',
        ),
        ['current', 'second', 'dropped-a', 'dropped-b', 'third'],
    );
});

test('a stale target leaves the queue unchanged', () => {
    const playbackIds = ['current', 'second'];

    assert.equal(
        insertQueueIdsAtTarget(playbackIds, ['dropped'], 'missing', 'top'),
        playbackIds,
    );
});
