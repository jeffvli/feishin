import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    getDetectedKeyId,
    resolveCamelotKey,
} from '/@/renderer/features/key-detection/detected-keys';

describe('resolveCamelotKey', () => {
    const song = { _serverId: 'server', id: 'song', tags: null };
    const detected = { [getDetectedKeyId(song)]: '5A' };

    it('prefers the key tag over a detected key', () => {
        assert.equal(resolveCamelotKey({ ...song, tags: { key: ['Am'] } }, detected), '8A');
    });

    it('falls back to the key detected for that song on that server', () => {
        assert.equal(resolveCamelotKey(song, detected), '5A');
        assert.equal(resolveCamelotKey({ ...song, _serverId: 'other' }, detected), null);
        assert.equal(resolveCamelotKey({ ...song, id: 'other' }, detected), null);
    });

    it('returns null without a song', () => {
        assert.equal(resolveCamelotKey(undefined, detected), null);
    });
});
