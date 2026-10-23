import { describe, expect, it } from 'vitest';

import { ssNormalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import { ExplicitStatus } from '/@/shared/types/domain-types';

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

const rawAlbum = {
    artist: 'Album Artist',
    artistId: 'aa-1',
    artists: [
        { id: 'aa-1', name: 'Album Artist' },
        { id: 'aa-2', name: 'Guest' },
    ],
    coverArt: 'al-cover',
    created: '2024-01-02T03:04:05Z',
    duration: 1800,
    id: 101,
    name: 'Album',
    songCount: 10,
    year: 2001,
};

const normalizeAlbum = (overrides: Record<string, unknown> = {}) =>
    ssNormalize.album({ ...rawAlbum, ...overrides } as unknown as Parameters<
        typeof ssNormalize.album
    >[0]);

describe('ssNormalize.album', () => {
    it('maps core fields', () => {
        expect(normalizeAlbum()).toMatchObject({
            albumArtistName: 'Album Artist',
            duration: 1_800_000,
            id: '101',
            imageId: 'al-cover',
            name: 'Album',
            releaseDate: '2001',
            releaseYear: 2001,
            songCount: 10,
            songs: [],
            userFavorite: false,
        });
        expect(normalizeAlbum().albumArtists.map((a) => a.id)).toEqual(['aa-1', 'aa-2']);
    });

    it('falls back to the single artist without an artist list', () => {
        expect(normalizeAlbum({ artists: undefined }).albumArtists).toEqual([
            expect.objectContaining({ id: 'aa-1', name: 'Album Artist' }),
        ]);
    });

    it('builds a zero-padded release date from the OpenSubsonic date object', () => {
        expect(normalizeAlbum({ releaseDate: { day: 3, month: 5, year: 2001 } })).toMatchObject({
            originalDate: '2001-05-03',
            releaseDate: '2001-05-03',
            releaseYear: 2001,
        });
    });

    it('returns nulls without any date information', () => {
        expect(normalizeAlbum({ year: undefined })).toMatchObject({
            releaseDate: null,
            releaseYear: null,
        });
    });

    it.each([
        ['explicit', ExplicitStatus.EXPLICIT],
        ['clean', ExplicitStatus.CLEAN],
        ['', null],
    ])('maps explicitStatus %j', (explicitStatus, expected) => {
        expect(normalizeAlbum({ explicitStatus }).explicitStatus).toBe(expected);
    });

    it('picks the first primary release type', () => {
        expect(
            normalizeAlbum({ releaseTypes: ['compilation', 'live', 'single', 'album'] }),
        ).toMatchObject({
            releaseType: 'single',
            releaseTypes: ['compilation', 'live', 'single', 'album'],
        });
        expect(normalizeAlbum({ releaseTypes: ['live'] }).releaseType).toBeNull();
        expect(normalizeAlbum().releaseType).toBeNull();
    });

    it('prefers the genre list over the single genre', () => {
        expect(
            normalizeAlbum({ genre: 'Rock', genres: [{ name: 'Jazz' }, { name: 'Funk' }] }).genres,
        ).toEqual([
            expect.objectContaining({ id: 'Jazz', name: 'Jazz' }),
            expect.objectContaining({ id: 'Funk', name: 'Funk' }),
        ]);
        expect(normalizeAlbum({ genre: 'Rock' }).genres).toEqual([
            expect.objectContaining({ id: 'Rock', name: 'Rock' }),
        ]);
        expect(normalizeAlbum().genres).toEqual([]);
    });

    it('maps disc titles and contributors', () => {
        const album = normalizeAlbum({
            contributors: [
                { artist: { id: 'p-1', name: 'Player' }, role: 'performer', subRole: 'guitar' },
                { artist: { id: 'c-1', name: 'Composer' }, role: 'composer' },
                { artist: { id: 'c-2', name: 'Other' }, role: 'composer' },
            ],
            discTitles: [
                { disc: 1, title: 'Studio' },
                { disc: 2, title: 'Live' },
            ],
        });
        expect(album.discs).toEqual({ 1: 'Studio', 2: 'Live' });
        expect(album.participants?.['performer (guitar)']?.map((a) => a.id)).toEqual(['p-1']);
        expect(album.participants?.composer?.map((a) => a.id)).toEqual(['c-1', 'c-2']);
        expect(normalizeAlbum()).toMatchObject({ discs: null, participants: null });
    });

    it('normalizes embedded songs', () => {
        expect(normalizeAlbum({ song: [rawSong] }).songs?.map((s) => s.id)).toEqual(['song-1']);
    });
});

describe('ssNormalize.albumArtist', () => {
    const rawArtist = { albumCount: '3', coverArt: 'ar-cover', id: 7, name: 'Artist' };

    const normalizeArtist = (overrides: Record<string, unknown> = {}) =>
        ssNormalize.albumArtist({ ...rawArtist, ...overrides } as unknown as Parameters<
            typeof ssNormalize.albumArtist
        >[0]);

    it('maps core fields', () => {
        expect(normalizeArtist()).toMatchObject({
            albumCount: 3,
            id: '7',
            imageId: 'ar-cover',
            name: 'Artist',
            starredAt: null,
            userFavorite: false,
        });
    });

    it('marks starred artists as favorites', () => {
        expect(normalizeArtist({ starred: '2024-01-01T00:00:00Z' })).toMatchObject({
            starredAt: '2024-01-01T00:00:00Z',
            userFavorite: true,
        });
    });

    it('maps similar artists, using the id when there is no cover art', () => {
        expect(
            normalizeArtist({ similarArtists: [{ id: 8, name: 'Other', starred: '2024' }] })
                .similarArtists,
        ).toEqual([expect.objectContaining({ id: '8', imageId: '8', userFavorite: true })]);
    });
});

describe('ssNormalize.playlist', () => {
    const rawPlaylist = {
        coverArt: 'pl-cover',
        created: '2024-01-01',
        duration: 60,
        id: 'pl-1',
        name: 'Playlist',
        owner: 'user',
        public: false,
        songCount: 3,
    };

    const normalizePlaylist = (overrides: Record<string, unknown> = {}) =>
        ssNormalize.playlist({ ...rawPlaylist, ...overrides } as unknown as Parameters<
            typeof ssNormalize.playlist
        >[0]);

    it('maps core fields', () => {
        expect(normalizePlaylist()).toMatchObject({
            description: null,
            duration: 60_000,
            id: 'pl-1',
            imageId: 'pl-cover',
            name: 'Playlist',
            owner: 'user',
            public: false,
            songCount: 3,
        });
    });

    it('busts the image cache when the playlist changes', () => {
        expect(normalizePlaylist({ changed: 'c1' }).imageId).toBe('pl-cover&_=c1');
        expect(normalizePlaylist({ changed: 'c1', coverArt: undefined }).imageId).toBeNull();
    });
});

describe('ssNormalize.folder', () => {
    it('splits children into subfolders and songs', () => {
        const folder = ssNormalize.folder({
            child: [{ ...rawSong, id: 'dir-1', isDir: true, title: 'Disc 1' }, rawSong],
            coverArt: 'cover',
            id: 5,
            parent: 'root',
            title: 'Album',
        } as unknown as Parameters<typeof ssNormalize.folder>[0]);

        expect(folder).toMatchObject({
            id: '5',
            imageId: 'cover',
            name: 'Album',
            parentId: 'root',
        });
        expect(folder.children?.folders.map((f) => [f.id, f.name])).toEqual([['dir-1', 'Disc 1']]);
        expect(folder.children?.songs.map((s) => s.id)).toEqual(['song-1']);
    });

    it('has empty children for an empty folder', () => {
        expect(
            ssNormalize.folder({ id: 'f', title: 'Empty' } as unknown as Parameters<
                typeof ssNormalize.folder
            >[0]).children,
        ).toEqual({ folders: [], songs: [] });
    });
});

describe('ssNormalize.genre and internetRadioStation', () => {
    it('uses the genre name as its id', () => {
        expect(
            ssNormalize.genre({ albumCount: 2, songCount: 20, value: 'Rock' }, null),
        ).toMatchObject({ albumCount: 2, id: 'Rock', name: 'Rock', songCount: 20 });
    });

    it('maps radio stations', () => {
        expect(
            ssNormalize.internetRadioStation({
                id: 'r1',
                name: 'Radio',
                streamUrl: 'https://stream.example/radio.mp3',
            }),
        ).toEqual({
            homepageUrl: null,
            id: 'r1',
            imageId: null,
            imageUrl: null,
            name: 'Radio',
            streamUrl: 'https://stream.example/radio.mp3',
        });
    });
});
