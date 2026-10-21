import { describe, expect, it } from 'vitest';

import { ssNormalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { ssType } from '/@/shared/api/subsonic/subsonic-types';

const rawSong = {
    album: 'Album',
    albumArtists: [],
    albumId: 'al-1',
    artist: 'Artist',
    artistId: 'ar-1',
    artists: [],
    bitRate: 320,
    contentType: 'audio/flac',
    coverArt: 'cover-1',
    created: '2024-01-02T03:04:05.000Z',
    discNumber: 2,
    duration: 215,
    id: 'song-1',
    isDir: false,
    isVideo: false,
    parent: 'al-1',
    path: 'Artist/Album/01.flac',
    size: 12345,
    suffix: 'flac',
    title: 'Title',
    track: 7,
    type: 'music',
    year: 2001,
};

describe('ssNormalize.song', () => {
    const song = ssNormalize.song(ssType._response.song.parse(rawSong));

    it('maps core fields', () => {
        expect(song).toMatchObject({
            album: 'Album',
            albumArtistName: 'Artist',
            albumId: 'al-1',
            artistName: 'Artist',
            container: 'flac',
            discNumber: 2,
            duration: 215000,
            id: 'song-1',
            imageId: 'cover-1',
            name: 'Title',
            trackNumber: 7,
        });
    });

    it('derives release and original year from year', () => {
        expect(song).toMatchObject({
            originalDate: '2001',
            originalYear: 2001,
            releaseDate: '2001',
            releaseYear: 2001,
        });
    });

    it('falls back to the track artist when no artist lists are present', () => {
        // Older servers omit `artists`; the schema requires it, so bypass parse here
        const normalized = ssNormalize.song({
            ...rawSong,
            albumArtists: undefined,
            artists: undefined,
        } as unknown as Parameters<typeof ssNormalize.song>[0]);
        expect(normalized.artists).toEqual([
            expect.objectContaining({ id: 'ar-1', name: 'Artist' }),
        ]);
    });
});
