import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldInterruptPlaybackForError } from '../src/renderer/features/player/audio-player/utils/player-utils.ts';

test('an active player error interrupts playback', () => {
    assert.equal(shouldInterruptPlaybackForError(1, 1), true);
});

test('an inactive queued-track preload error leaves playback running', () => {
    assert.equal(shouldInterruptPlaybackForError(1, 2), false);
});
