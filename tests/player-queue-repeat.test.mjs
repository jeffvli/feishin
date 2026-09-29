import assert from 'node:assert/strict';
import test from 'node:test';

import { removeQueueIds, shouldRefillQueue } from '../src/renderer/store/player-queue-repeat.ts';

test('repeat off never refills an exhausted queue', () => {
    assert.equal(shouldRefillQueue('none'), false);
});

test('shuffle does not change the repeat-off refill decision', () => {
    const shuffleEnabled = true;

    assert.equal(shuffleEnabled && shouldRefillQueue('none'), false);
});

test('repeat all permits an exhausted queue to refill', () => {
    assert.equal(shouldRefillQueue('all'), true);
});

test('repeat one does not refill the consumed queue', () => {
    assert.equal(shouldRefillQueue('one'), false);
});

test('cancelling a prepared refill preserves current and manually added tracks', () => {
    const result = removeQueueIds(
        ['current', 'prepared-1', 'manual', 'prepared-2'],
        [],
        ['prepared-1', 'prepared-2'],
    );

    assert.deepEqual(result, {
        defaultIds: ['current', 'manual'],
        shuffledIndexes: [],
    });
});

test('cancelling a shuffled prepared refill remaps its queue indexes', () => {
    const result = removeQueueIds(
        ['current', 'prepared-1', 'manual', 'prepared-2', 'manual-2'],
        [0, 3, 2, 1, 4],
        ['prepared-1', 'prepared-2'],
    );

    assert.deepEqual(result, {
        defaultIds: ['current', 'manual', 'manual-2'],
        shuffledIndexes: [0, 1, 2],
    });
});

test('cancelling without prepared tracks leaves queue order unchanged', () => {
    const result = removeQueueIds(['current', 'manual'], [1, 0], []);

    assert.deepEqual(result, {
        defaultIds: ['current', 'manual'],
        shuffledIndexes: [1, 0],
    });
});
