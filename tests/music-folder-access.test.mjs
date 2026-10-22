import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveMusicFolderAccessChange } from '../src/renderer/features/shared/utils/music-folder-access.ts';

const resolveRevokedFolder = (isPlaying) =>
    resolveMusicFolderAccessChange({
        availableIds: ['christmas'],
        isPlaying,
        selectedIds: ['main-library'],
    });

test('defers a revoked music-folder refresh while playback is active', () => {
    assert.deepEqual(resolveRevokedFolder(true), {
        clearQueue: false,
        deferred: true,
        replacementIds: ['christmas'],
    });
});

test('applies the pending refresh and clears the queue after playback is paused or stopped', () => {
    assert.deepEqual(resolveRevokedFolder(false), {
        clearQueue: true,
        deferred: false,
        replacementIds: ['christmas'],
    });
});
