import assert from 'node:assert/strict';
import test from 'node:test';

import {
    calculateCrossfadeVolumes,
    captureCrossfadeTransitionSettings,
    resolveCrossfadeTransitionSettings,
    resolveManualCrossfadeDuration,
} from '../src/renderer/features/player/audio-player/utils/crossfade-transition.ts';

test('an active crossfade keeps the settings it started with', () => {
    const activeSettings = captureCrossfadeTransitionSettings(5, 'equalPower');

    assert.deepEqual(
        resolveCrossfadeTransitionSettings(true, activeSettings, 12, 'linear'),
        activeSettings,
    );
});

test('a future crossfade uses settings changed during playback', () => {
    const priorSettings = captureCrossfadeTransitionSettings(5, 'equalPower');

    assert.deepEqual(resolveCrossfadeTransitionSettings(false, priorSettings, 12, 'linear'), {
        duration: 12,
        style: 'linear',
    });
});

test('manual crossfade volumes move cleanly from the current track to the next track', () => {
    assert.deepEqual(calculateCrossfadeVolumes(0, 40, 'linear'), {
        current: 40,
        next: 0,
    });
    assert.deepEqual(calculateCrossfadeVolumes(0.5, 40, 'linear'), {
        current: 20,
        next: 20,
    });
    assert.deepEqual(calculateCrossfadeVolumes(1, 40, 'linear'), {
        current: 0,
        next: 40,
    });
});

test('manual crossfade duration is capped by either track ending', () => {
    assert.equal(resolveManualCrossfadeDuration(5, [8, 12]), 5);
    assert.equal(resolveManualCrossfadeDuration(5, [2, 12]), 2);
    assert.equal(resolveManualCrossfadeDuration(5, [Number.NaN, 1.5]), 1.5);
});
