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

const rawAlbum = {
    albumArtist: 'Album Artist',
    albumArtistId: 'aa-1',
    compilation: false,
    createdAt: '2024-01-02T03:04:05Z',
    duration: 1800.5,
    externalInfoUpdatedAt: null,
    genre: 'Rock',
    genres: [{ id: 'g-1', name: 'Rock' }],
    id: 'al-1',
    libraryId: 1,
    libraryName: 'Music',
    libraryPath: '/music',
    maxYear: 2003,
    minYear: 2001,
    name: 'Album',
    orderAlbumArtistName: 'album artist',
    orderAlbumName: 'album',
    size: 999,
    songCount: 10,
    updatedAt: '2024-01-02T03:04:05Z',
};

const normalizeAlbum = (overrides: Record<string, unknown> = {}) =>
    ndNormalize.album(ndType._response.album.parse({ ...rawAlbum, ...overrides }));

describe('ndNormalize.album', () => {
    it('maps core fields', () => {
        expect(normalizeAlbum()).toMatchObject({
            _serverType: ServerType.NAVIDROME,
            albumArtistName: 'Album Artist',
            duration: 1800500,
            gain: null,
            id: 'al-1',
            imageId: 'al-1',
            isCompilation: false,
            name: 'Album',
            peak: null,
            songCount: 10,
            sortName: 'album',
            trackYearRange: { max: 2003, min: 2001 },
        });
    });

    it('prefers the legacy coverArtId as image id', () => {
        expect(normalizeAlbum({ coverArtId: 'cover-1' }).imageId).toBe('cover-1');
    });

    it('ignores the zero play date sent for never played albums', () => {
        expect(normalizeAlbum({ playDate: '0001-01-01T00:00:00Z' }).lastPlayedAt).toBeNull();
        expect(normalizeAlbum({ playDate: '2024-05-01T00:00:00Z' }).lastPlayedAt).toBe(
            '2024-05-01T00:00:00Z',
        );
    });

    describe('dates', () => {
        it('falls back to minYear', () => {
            expect(normalizeAlbum()).toMatchObject({
                originalDate: '2001',
                originalYear: 2001,
                releaseDate: '2001',
                releaseYear: 2001,
            });
        });

        it('prefers releaseDate, then date, for the release', () => {
            expect(normalizeAlbum({ date: '2002-01', releaseDate: '2010-02-03' })).toMatchObject({
                releaseDate: '2010-02-03',
                releaseYear: 2010,
            });
            expect(normalizeAlbum({ date: '2002-01' })).toMatchObject({
                releaseDate: '2002-01',
                releaseYear: 2002,
            });
        });

        it('prefers originalDate, then the release date, for the original', () => {
            expect(
                normalizeAlbum({ originalDate: '1990', releaseDate: '2010-02-03' }),
            ).toMatchObject({ originalDate: '1990', originalYear: 1990 });
            expect(normalizeAlbum({ releaseDate: '2010-02-03' })).toMatchObject({
                originalDate: '2010-02-03',
                originalYear: 2010,
            });
        });

        it('uses minOriginalYear over minYear for the original', () => {
            expect(normalizeAlbum({ minOriginalYear: 1985 })).toMatchObject({
                originalDate: '1985',
                originalYear: 1985,
                releaseYear: 2001,
            });
        });

        it('returns nulls without any date information', () => {
            expect(normalizeAlbum({ minYear: 0 })).toMatchObject({
                originalDate: null,
                releaseDate: null,
                releaseYear: null,
            });
        });
    });

    it('extracts record labels, release types and version from tags', () => {
        expect(
            normalizeAlbum({
                tags: {
                    albumversion: ['Deluxe', 'Remastered'],
                    genre: ['Rock'],
                    media: ['CD'],
                    recordlabel: ['Label'],
                    releasetype: ['album', 'live'],
                },
            }),
        ).toMatchObject({
            recordLabels: ['Label'],
            releaseTypes: ['album', 'live'],
            tags: { media: ['CD'] },
            version: 'Deluxe · Remastered',
        });

        expect(normalizeAlbum()).toMatchObject({
            recordLabels: [],
            releaseTypes: [],
            tags: null,
            version: null,
        });
    });

    it('normalizes embedded songs', () => {
        const album = ndNormalize.album({
            ...ndType._response.album.parse(rawAlbum),
            songs: [ndType._response.song.parse(rawSong)],
        });
        expect(album.songs?.map((s) => s.id)).toEqual(['song-1']);
    });
});

const rawAlbumArtist = {
    albumCount: 2,
    id: 'aa-1',
    name: 'Album Artist',
    size: 999,
    songCount: 20,
};

const normalizeAlbumArtist = (overrides: Record<string, unknown> = {}) =>
    ndNormalize.albumArtist(
        ndType._response.albumArtist.parse({ ...rawAlbumArtist, ...overrides }),
    );

describe('ndNormalize.albumArtist', () => {
    it('maps core fields', () => {
        expect(normalizeAlbumArtist()).toMatchObject({
            _serverType: ServerType.NAVIDROME,
            albumCount: 2,
            id: 'aa-1',
            imageId: 'aa-1',
            name: 'Album Artist',
            similarArtists: [],
            songCount: 20,
        });
    });

    it('takes the larger counts from the role stats', () => {
        expect(
            normalizeAlbumArtist({
                stats: {
                    albumartist: { albumCount: 3, size: 1, songCount: 30 },
                    artist: { albumCount: 5, size: 1, songCount: 12 },
                },
            }),
        ).toMatchObject({ albumCount: 5, songCount: 30 });
    });

    it('busts the image cache only for uploaded images', () => {
        expect(normalizeAlbumArtist({ updatedAt: 'u1' }).imageId).toBe('aa-1');
        expect(normalizeAlbumArtist({ updatedAt: 'u1', uploadedImage: 'a.jpg' }).imageId).toBe(
            'aa-1&_=u1',
        );
    });

    it('maps similar artists', () => {
        const artist = ndNormalize.albumArtist({
            ...ndType._response.albumArtist.parse(rawAlbumArtist),
            similarArtists: [{ id: 'aa-2', name: 'Other', starred: '2024-01-01' }],
        } as Parameters<typeof ndNormalize.albumArtist>[0]);
        expect(artist.similarArtists).toEqual([
            expect.objectContaining({ id: 'aa-2', name: 'Other', userFavorite: true }),
        ]);
    });
});

describe('ndNormalize.playlist', () => {
    const playlist = ndNormalize.playlist(
        ndType._response.playlist.parse({
            comment: 'Desc',
            createdAt: '2024-01-01',
            duration: 60.5,
            evaluatedAt: null,
            id: 'pl-1',
            name: 'Playlist',
            ownerId: 'u-1',
            ownerName: 'user',
            path: '',
            public: true,
            rules: null,
            size: 100,
            songCount: 3,
            sync: false,
            updatedAt: 'u1',
        }),
    );

    it('maps core fields', () => {
        expect(playlist).toMatchObject({
            description: 'Desc',
            duration: 60500,
            id: 'pl-1',
            name: 'Playlist',
            owner: 'user',
            public: true,
            rules: null,
            songCount: 3,
        });
    });

    it('always busts the image cache so regenerated covers show up', () => {
        expect(playlist.imageId).toBe('pl-1&_=u1');
    });
});
