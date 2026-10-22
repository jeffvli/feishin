import { describe, expect, it } from 'vitest';

import {
    getFeatures,
    hasFeature,
    hasFeatureWithVersion,
    replacePathPrefix,
    sortAlbumArtistList,
    sortAlbumList,
    sortRadioList,
    sortSongList,
    sortSongsByFetchedOrder,
    VersionInfo,
} from '/@/shared/api/utils';
import {
    Album,
    AlbumArtist,
    AlbumArtistListSort,
    AlbumListSort,
    InternetRadioStation,
    LibraryItem,
    RadioListSort,
    ServerListItem,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const versionInfo: VersionInfo = [
    ['0.55.0', { [ServerFeature.LYRICS_MULTIPLE_STRUCTURED]: [1] }],
    ['0.49.3', { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1] }],
    ['0.48.0', { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [2] }],
];

describe('getFeatures', () => {
    it('includes every feature from the first matching version down', () => {
        expect(getFeatures(versionInfo, '0.50.1')).toEqual({
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1, 2],
        });
    });

    it('matches an exact version', () => {
        expect(getFeatures(versionInfo, '0.48.0')).toEqual({
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [2],
        });
    });

    it('returns nothing for older servers', () => {
        expect(getFeatures(versionInfo, '0.47.9')).toEqual({});
    });

    it('coerces non-semver version strings', () => {
        expect(getFeatures(versionInfo, '10.10.7.0')).toHaveProperty(
            ServerFeature.LYRICS_MULTIPLE_STRUCTURED,
        );
        expect(getFeatures(versionInfo, '0.55.0 (abc123)')).toHaveProperty(
            ServerFeature.LYRICS_MULTIPLE_STRUCTURED,
        );
    });

    it('enables everything for an unparseable version', () => {
        expect(Object.keys(getFeatures(versionInfo, 'dev'))).toHaveLength(2);
    });
});

describe('hasFeature', () => {
    const server = {
        features: { [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1, 2] },
    } as unknown as ServerListItem;

    it('checks whether a feature is present', () => {
        expect(hasFeature(server, ServerFeature.LYRICS_SINGLE_STRUCTURED)).toBe(true);
        expect(hasFeature(server, ServerFeature.LYRICS_MULTIPLE_STRUCTURED)).toBe(false);
        expect(hasFeature(null, ServerFeature.LYRICS_SINGLE_STRUCTURED)).toBe(false);
    });

    it('checks a specific feature version', () => {
        expect(hasFeatureWithVersion(server, ServerFeature.LYRICS_SINGLE_STRUCTURED, 2)).toBe(true);
        expect(hasFeatureWithVersion(server, ServerFeature.LYRICS_SINGLE_STRUCTURED, 3)).toBe(
            false,
        );
    });
});

const song = (id: string, fields: Partial<Song> = {}) =>
    ({
        album: 'Album',
        albumArtists: [],
        albumId: 'al-1',
        artists: [],
        discNumber: 1,
        genres: [],
        id,
        name: id,
        trackNumber: 1,
        ...fields,
    }) as Song;

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('sortSongList', () => {
    const songs = [
        song('c', { album: 'b-side', discNumber: 1, trackNumber: 2 }),
        song('a', { album: 'A-side', discNumber: 2, trackNumber: 1 }),
        song('b', { album: 'B-Side', discNumber: 1, trackNumber: 1 }),
        song('d', { album: 'a-side', discNumber: 1, trackNumber: 5 }),
    ];

    it('sorts by album case-insensitively, then disc and track', () => {
        expect(ids(sortSongList(songs, SongListSort.ALBUM, SortOrder.ASC))).toEqual([
            'd',
            'a',
            'b',
            'c',
        ]);
        expect(ids(sortSongList(songs, SongListSort.ALBUM, SortOrder.DESC))).toEqual([
            'c',
            'b',
            'a',
            'd',
        ]);
    });

    it('sorts by the first album artist, then album', () => {
        const list = [
            song('a', {
                album: 'Z',
                albumArtists: [{ id: '1', name: 'beta' }] as Song['albumArtists'],
            }),
            song('b', {
                album: 'A',
                albumArtists: [{ id: '2', name: 'Alpha' }] as Song['albumArtists'],
            }),
            song('c', {
                album: 'B',
                albumArtists: [{ id: '2', name: 'alpha' }] as Song['albumArtists'],
            }),
        ];
        expect(ids(sortSongList(list, SongListSort.ALBUM_ARTIST, SortOrder.ASC))).toEqual([
            'b',
            'c',
            'a',
        ]);
    });

    it('sorts by name case-insensitively', () => {
        const list = [song('x', { name: 'beta' }), song('y', { name: 'Alpha' })];
        expect(ids(sortSongList(list, SongListSort.NAME, SortOrder.ASC))).toEqual(['y', 'x']);
    });

    it('sorts by sort name, falling back to name', () => {
        const list = [
            song('x', { name: 'The Beta', sortName: 'Beta' }),
            song('y', { name: 'Alpha', sortName: undefined }),
            song('z', { name: 'Gamma' }),
        ];
        expect(ids(sortSongList(list, SongListSort.SORT_NAME, SortOrder.ASC))).toEqual([
            'y',
            'x',
            'z',
        ]);
    });

    it('sorts by the day added, then by track order within the day', () => {
        const list = [
            song('late-track', { createdAt: '2024-01-02T12:00:00Z', trackNumber: 2 }),
            song('older', { createdAt: '2023-12-31T12:00:00Z' }),
            song('early-track', { createdAt: '2024-01-02T12:30:00Z', trackNumber: 1 }),
        ];
        expect(ids(sortSongList(list, SongListSort.RECENTLY_ADDED, SortOrder.ASC))).toEqual([
            'older',
            'early-track',
            'late-track',
        ]);
    });

    it('keeps the fetched order for ID and reverses it for descending', () => {
        expect(ids(sortSongList(songs, SongListSort.ID, SortOrder.ASC))).toEqual(ids(songs));
        expect(ids(sortSongList(songs, SongListSort.ID, SortOrder.DESC))).toEqual([
            'd',
            'b',
            'a',
            'c',
        ]);
        expect(ids(songs)).toEqual(['c', 'a', 'b', 'd']);
    });

    it('shuffles without losing songs', () => {
        expect(ids(sortSongList(songs, SongListSort.RANDOM, SortOrder.ASC)).sort()).toEqual([
            'a',
            'b',
            'c',
            'd',
        ]);
    });
});

describe('sortSongsByFetchedOrder', () => {
    const songs = [
        song('a2', { albumId: 'al-a', trackNumber: 2 }),
        song('b1', { albumId: 'al-b', trackNumber: 1 }),
        song('x', { albumId: 'al-x', trackNumber: 1 }),
        song('a1', { albumId: 'al-a', trackNumber: 1 }),
    ];

    it('groups songs in the order the items were requested, sorted by track', () => {
        expect(ids(sortSongsByFetchedOrder(songs, ['al-b', 'al-a'], LibraryItem.ALBUM))).toEqual([
            'b1',
            'a1',
            'a2',
            'x',
        ]);
    });

    it('keeps the server order inside album artist groups', () => {
        const list = [
            song('s2', { albumArtists: [{ id: 'ar-1' }] as Song['albumArtists'], trackNumber: 2 }),
            song('t1', { albumArtists: [{ id: 'ar-2' }] as Song['albumArtists'] }),
            song('s1', { albumArtists: [{ id: 'ar-1' }] as Song['albumArtists'], trackNumber: 1 }),
        ];
        expect(
            ids(sortSongsByFetchedOrder(list, ['ar-2', 'ar-1'], LibraryItem.ALBUM_ARTIST)),
        ).toEqual(['t1', 's2', 's1']);
    });

    it('returns folder songs unchanged', () => {
        expect(sortSongsByFetchedOrder(songs, ['al-b'], LibraryItem.FOLDER)).toBe(songs);
    });
});

const album = (id: string, fields: Partial<Album> = {}) => ({ id, name: id, ...fields }) as Album;

describe('sortAlbumList', () => {
    it('sorts by name case-insensitively', () => {
        const list = [album('x', { name: 'beta' }), album('y', { name: 'Alpha' })];
        expect(ids(sortAlbumList(list, AlbumListSort.NAME, SortOrder.ASC))).toEqual(['y', 'x']);
        expect(ids(sortAlbumList(list, AlbumListSort.NAME, SortOrder.DESC))).toEqual(['x', 'y']);
    });

    it('sorts by year', () => {
        const list = [album('x', { releaseYear: 2010 }), album('y', { releaseYear: 1999 })];
        expect(ids(sortAlbumList(list, AlbumListSort.YEAR, SortOrder.ASC))).toEqual(['y', 'x']);
    });

    it('sorts by original date, then release date, then name', () => {
        const list = [
            album('remaster', { originalYear: 1995, releaseDate: '2015-01-01' }),
            album('newer', { originalDate: '2001-05-01' }),
            album('b', { originalDate: '1990-01-01', releaseDate: '1990-01-01' }),
            album('a', { originalDate: '1990-01-01', releaseDate: '1990-01-01' }),
        ];
        expect(ids(sortAlbumList(list, AlbumListSort.RELEASE_DATE, SortOrder.ASC))).toEqual([
            'a',
            'b',
            'remaster',
            'newer',
        ]);
    });

    // Regression: sorted by the nonexistent `albumArtist` field, so only the name was used
    it('sorts by album artist case-insensitively, then by name', () => {
        const list = [
            album('zeta-b', { albumArtistName: 'Zeta', name: 'B' }),
            album('alpha', { albumArtistName: 'alpha', name: 'C' }),
            album('zeta-a', { albumArtistName: 'Zeta', name: 'A' }),
        ];
        expect(ids(sortAlbumList(list, AlbumListSort.ALBUM_ARTIST, SortOrder.ASC))).toEqual([
            'alpha',
            'zeta-a',
            'zeta-b',
        ]);
        expect(ids(sortAlbumList(list, AlbumListSort.ALBUM_ARTIST, SortOrder.DESC))).toEqual([
            'zeta-a',
            'zeta-b',
            'alpha',
        ]);
    });

    // Regression: sorted by the nonexistent `starred` field, so the order never changed
    it('sorts favorites first when descending', () => {
        const list = [
            album('x', { userFavorite: false }),
            album('y', { userFavorite: true }),
            album('z', { userFavorite: false }),
        ];
        expect(ids(sortAlbumList(list, AlbumListSort.FAVORITED, SortOrder.DESC))).toEqual([
            'y',
            'x',
            'z',
        ]);
    });

    it('reverses the fetched order for descending ID without mutating the input', () => {
        const list = [album('x'), album('y')];
        expect(ids(sortAlbumList(list, AlbumListSort.ID, SortOrder.DESC))).toEqual(['y', 'x']);
        expect(ids(list)).toEqual(['x', 'y']);
    });
});

describe('sortAlbumArtistList', () => {
    const artist = (id: string, fields: Partial<AlbumArtist> = {}) =>
        ({ id, name: id, ...fields }) as AlbumArtist;

    it('sorts by album count with name as an ascending tiebreak', () => {
        const list = [
            artist('b', { albumCount: 2 }),
            artist('c', { albumCount: 5 }),
            artist('a', { albumCount: 2 }),
        ];
        expect(
            ids(sortAlbumArtistList(list, AlbumArtistListSort.ALBUM_COUNT, SortOrder.DESC)),
        ).toEqual(['c', 'a', 'b']);
    });

    // Regression: sorted by the nonexistent `starred` field, so the order never changed
    it('sorts favorites first when descending', () => {
        const list = [artist('x', { userFavorite: false }), artist('y', { userFavorite: true })];
        expect(
            ids(sortAlbumArtistList(list, AlbumArtistListSort.FAVORITED, SortOrder.DESC)),
        ).toEqual(['y', 'x']);
    });

    it('sorts by name case-insensitively', () => {
        const list = [artist('x', { name: 'beta' }), artist('y', { name: 'Alpha' })];
        expect(ids(sortAlbumArtistList(list, AlbumArtistListSort.NAME, SortOrder.ASC))).toEqual([
            'y',
            'x',
        ]);
    });
});

describe('replacePathPrefix', () => {
    it('maps a server path to a local path', () => {
        expect(replacePathPrefix('/music/Artist/song.flac', '/music', 'Z:')).toBe(
            'Z:/Artist/song.flac',
        );
    });

    it('only replaces a matching prefix', () => {
        expect(replacePathPrefix('/data/music/song.flac', '/music', '/mnt')).toBe(
            '/mnt/data/music/song.flac',
        );
    });

    it('returns the path unchanged without a mapping', () => {
        expect(replacePathPrefix('/music/song.flac')).toBe('/music/song.flac');
    });

    it('strips the prefix when there is no replacement', () => {
        expect(replacePathPrefix('/music/song.flac', '/music')).toBe('/song.flac');
    });
});

describe('sortRadioList', () => {
    const stations = [
        { id: '1', name: 'beta' },
        { id: '2', name: 'Alpha' },
    ] as InternetRadioStation[];

    it('sorts by name case-insensitively', () => {
        expect(ids(sortRadioList(stations, RadioListSort.NAME, SortOrder.ASC))).toEqual(['2', '1']);
    });

    it('reverses the fetched order for descending ID without mutating the input', () => {
        expect(ids(sortRadioList(stations, RadioListSort.ID, SortOrder.DESC))).toEqual(['2', '1']);
        expect(ids(stations)).toEqual(['1', '2']);
    });
});
