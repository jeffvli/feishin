import { describe, expect, it } from 'vitest';

import { ndNormalize } from '/@/shared/api/navidrome/navidrome-normalize';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { ExplicitStatus } from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

const rawSong = {
    album: 'Album',
    albumArtist: 'Album Artist',
    albumArtistId: 'aa-1',
    albumId: 'al-1',
    artist: 'Artist',
    artistId: 'ar-1',
    bitRate: 1000,
    bookmarkPosition: 0,
    compilation: false,
    createdAt: '2024-01-02T03:04:05Z',
    discNumber: 1,
    duration: 215.5,
    genre: 'Rock',
    genres: [{ id: 'g-1', name: 'Rock' }],
    hasCoverArt: true,
    id: 'song-1',
    libraryPath: '/music',
    orderAlbumArtistName: 'album artist',
    orderAlbumName: 'album',
    orderArtistName: 'artist',
    orderTitle: 'title',
    path: 'Artist/Album/01.flac',
    sampleRate: 44100,
    size: 12345,
    suffix: 'flac',
    title: 'Title',
    trackNumber: 3,
    updatedAt: '2024-01-02T03:04:05Z',
    year: 2001,
};

const normalize = (overrides: Record<string, unknown> = {}) =>
    ndNormalize.song(ndType._response.song.parse({ ...rawSong, ...overrides }));

describe('ndNormalize.song', () => {
    it('maps core fields', () => {
        expect(normalize()).toMatchObject({
            _serverId: 'unknown',
            _serverType: ServerType.NAVIDROME,
            album: 'Album',
            albumArtistName: 'Album Artist',
            albumId: 'al-1',
            artistName: 'Artist',
            container: 'flac',
            duration: 215500,
            id: 'song-1',
            imageId: 'song-1',
            name: 'Title',
            path: '/music/Artist/Album/01.flac',
            playlistItemId: undefined,
            sortName: 'title',
            trackNumber: 3,
        });
    });

    it('uses the server id when given', () => {
        const song = ndNormalize.song(ndType._response.song.parse(rawSong), {
            id: 'server-1',
        } as ServerListItem);
        expect(song._serverId).toBe('server-1');
    });

    it('uses mediaFileId as the song id for playlist songs', () => {
        const song = ndNormalize.song(
            ndType._response.playlistSong.parse({
                ...rawSong,
                id: 'entry-7',
                mediaFileId: 'song-1',
                playlistId: 'pl-1',
            }),
        );
        expect(song).toMatchObject({ id: 'song-1', imageId: 'song-1', playlistItemId: 'entry-7' });
    });

    it.each([
        ['e', ExplicitStatus.EXPLICIT],
        ['c', ExplicitStatus.CLEAN],
        ['', null],
        [undefined, null],
    ])('maps explicitStatus %j to %s', (explicitStatus, expected) => {
        expect(normalize({ explicitStatus }).explicitStatus).toBe(expected);
    });

    it('maps replay gain and peak only when present', () => {
        expect(normalize()).toMatchObject({ gain: null, peak: null });
        expect(
            normalize({ rgAlbumGain: -6, rgAlbumPeak: 0.9, rgTrackGain: -7, rgTrackPeak: 0.8 }),
        ).toMatchObject({
            gain: { album: -6, track: -7 },
            peak: { album: 0.9, track: 0.8 },
        });
        expect(normalize({ rgAlbumGain: null, rgTrackGain: -7 }).gain).toEqual({
            album: undefined,
            track: -7,
        });
    });

    describe('dates', () => {
        it('falls back to year when there are no date strings', () => {
            expect(normalize()).toMatchObject({
                date: '2001',
                originalDate: null,
                originalYear: null,
                releaseDate: '2001',
                releaseYear: 2001,
                year: 2001,
            });
        });

        it('prefers full date strings', () => {
            expect(
                normalize({
                    date: '2001-05-03',
                    originalDate: '1999-01',
                    releaseDate: '2010-02-03',
                    year: 0,
                }),
            ).toMatchObject({
                date: '2001-05-03',
                originalDate: '1999-01',
                originalYear: 1999,
                releaseDate: '2010-02-03',
                releaseYear: 2010,
                year: 2001,
            });
        });

        it('prefers releaseYear over the song year', () => {
            expect(normalize({ releaseYear: 2015 })).toMatchObject({
                releaseDate: '2015',
                releaseYear: 2015,
                year: 2001,
            });
        });

        it('returns nulls when no date information exists', () => {
            expect(normalize({ year: 0 })).toMatchObject({
                date: null,
                releaseDate: null,
                releaseYear: null,
                year: null,
            });
        });
    });

    describe('artists', () => {
        it('falls back to the flat artist fields without participants', () => {
            const song = normalize();
            expect(song.albumArtists).toEqual([expect.objectContaining({ id: 'aa-1' })]);
            expect(song.artists).toEqual([expect.objectContaining({ id: 'ar-1', name: 'Artist' })]);
            expect(song.participants).toBeNull();
        });

        it('splits participants into roles and adds remixers to artists', () => {
            const song = normalize({
                participants: {
                    albumartist: [{ id: 'aa-2', name: 'AA' }],
                    artist: [{ id: 'ar-2', name: 'A' }],
                    performer: [
                        { id: 'p-1', name: 'Guitarist', subRole: 'guitar' },
                        { id: 'p-2', name: 'Singer' },
                    ],
                    remixer: [
                        { id: 'ar-2', name: 'A' },
                        { id: 'rx-1', name: 'Remixer' },
                    ],
                },
            });

            expect(song.albumArtists?.map((a) => a.id)).toEqual(['aa-2']);
            expect(song.artists.map((a) => a.id)).toEqual(['ar-2', 'rx-1']);
            expect(Object.keys(song.participants ?? {}).sort()).toEqual([
                'performer',
                'performer (guitar)',
                'remixer',
            ]);
        });
    });
});
