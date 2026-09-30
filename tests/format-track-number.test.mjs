import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTrackNumber } from '../src/renderer/components/item-list/item-detail-list/columns/format-track-number.ts';

test('formats a numbered track with its disc number', () => {
    assert.equal(formatTrackNumber({ discNumber: 2, trackNumber: 7 }), '2-07');
});

test('defaults a missing disc number to disc one', () => {
    assert.equal(formatTrackNumber({ trackNumber: 3 }), '1-03');
});

test('shows a fallback when Jellyfin omits the track number', () => {
    assert.equal(formatTrackNumber({ discNumber: 1 }), '—');
});

test('shows a fallback for a null track number', () => {
    assert.equal(formatTrackNumber({ discNumber: 1, trackNumber: null }), '—');
});

test('shows a fallback for an invalid numeric track number', () => {
    assert.equal(formatTrackNumber({ discNumber: 1, trackNumber: Number.NaN }), '—');
});
