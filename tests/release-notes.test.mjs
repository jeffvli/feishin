import assert from 'node:assert/strict';
import test from 'node:test';

import { generateReleaseNotes } from '../scripts/automation/generate-release-notes.mjs';

test('release notes add a funny title without replacing the generated change list', () => {
    const releaseNotes = generateReleaseNotes({ channel: 'release', version: '1.6.0' });

    assert.match(releaseNotes.title, /^KatiesAmp v1\.6\.0: /);
    assert.match(releaseNotes.notes, /^## /);
    assert.match(releaseNotes.notes, /proper release notes/);
});

test('beta and hotfix releases use the matching release personality', () => {
    const beta = generateReleaseNotes({ channel: 'beta', version: '1.7.0-beta.2' });
    const hotfix = generateReleaseNotes({ channel: 'release', version: '1.6.1' });

    assert.match(beta.notes, /soundcheck|test bench|new beta/i);
    assert.match(hotfix.notes, /small adjustment|squeak|tune-up/i);
});

test('a curated release title and introduction override the automatic joke', () => {
    assert.deepEqual(
        generateReleaseNotes({
            channel: 'release',
            customIntro: 'The hand-picked introduction.',
            customTitle: 'Permission to Rock',
            version: '1.6.0',
        }),
        {
            notes: '## Permission to Rock\n\nThe hand-picked introduction.\n\nThe important bits are below, because even a good joke should come with proper release notes.',
            title: 'KatiesAmp v1.6.0: Permission to Rock',
        },
    );
});

test('invalid release-note inputs are rejected', () => {
    assert.throws(
        () => generateReleaseNotes({ channel: 'release', version: '1.6' }),
        /Invalid KatiesAmp release version/,
    );
    assert.throws(
        () => generateReleaseNotes({ channel: 'nightly', version: '1.6.0' }),
        /Unsupported release channel/,
    );
});
