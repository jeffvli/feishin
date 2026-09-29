import assert from 'node:assert/strict';
import test from 'node:test';

import { getQueueBackgroundDropMode } from '../src/renderer/features/now-playing/components/queue-drop.ts';

test('a background drop appends when the queue already contains tracks', () => {
    assert.equal(getQueueBackgroundDropMode(12), 'append');
});

test('a background drop starts playback only when the queue is genuinely empty', () => {
    assert.equal(getQueueBackgroundDropMode(0), 'start');
});
