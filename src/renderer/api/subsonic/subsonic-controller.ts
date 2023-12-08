import orderBy from 'lodash/orderBy';
import shuffle from 'lodash/shuffle';
import filter from 'lodash/filter';
import reverse from 'lodash/reverse';
import md5 from 'md5';
import { fsLog } from '/@/logger';
import { subsonicApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { subsonicNormalize } from '/@/renderer/api/subsonic/subsonic-normalize';
import { AlbumListSortType, SubsonicApi } from '/@/renderer/api/subsonic/subsonic-types';
import {
    AlbumArtistListSort,
    AlbumListSort,
    AuthenticationResponse,
    ControllerEndpoint,
    GenreListSort,
    LibraryItem,
    PlaylistListSort,
    SongListSort,
} from '/@/renderer/api/types';
import { randomString } from '/@/renderer/utils';

const authenticate = async (
    url: string,
    body: {
        legacy?: boolean;
        password: string;
        username: string;
    },
): Promise<AuthenticationResponse> => {
    let credential: string;
    let credentialParams: {
        p?: string;
        s?: string;
        t?: string;
        u: string;
    };

    const cleanServerUrl = url.replace(/\/$/, '');

    if (body.legacy) {
        credential = `u=${body.username}&p=${body.password}`;
        credentialParams = {
            p: body.password,
            u: body.username,
        };
    } else {
        const salt = randomString(12);
        const hash = md5(body.password + salt);
        credential = `u=${body.username}&s=${salt}&t=${hash}`;
        credentialParams = {
            s: salt,
            t: hash,
            u: body.username,
        };
    }

    await subsonicApiClient({ server: null, url: cleanServerUrl }).ping({
        query: {
            c: 'Feishin',
            f: 'json',
            v: '1.13.0',
            ...credentialParams,
        },
    });

    return {
        credential,
        userId: null,
        username: body.username,
    };
};

export const SubsonicController: ControllerEndpoint = {
    addToPlaylist: async (args) => {
        const { body, query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).updatePlaylist({
            query: {
                playlistId: query.id,
                songIdToAdd: body.songId,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to add to playlist');
            throw new Error('Failed to add to playlist');
        }

        return null;
    },
    authenticate: async (url, body) => {
        const res = await authenticate(url, body);
        return res;
    },
    createFavorite: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).star({
            query: {
                albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
                artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
                id: query.type === LibraryItem.SONG ? query.id : undefined,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to create favorite');
            throw new Error('Failed to create favorite');
        }

        return null;
    },
    createPlaylist: async (args) => {
        const { body, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).createPlaylist({
            query: {
                name: body.name,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to create playlist');
            throw new Error('Failed to create playlist');
        }

        return {
            id: res.body['subsonic-response'].playlist.id,
            name: res.body['subsonic-response'].playlist.name,
        };
    },
    deleteFavorite: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).unstar({
            query: {
                albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
                artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
                id: query.type === LibraryItem.SONG ? query.id : undefined,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to delete favorite');
            throw new Error('Failed to delete favorite');
        }

        return null;
    },
    deletePlaylist: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).deletePlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to delete playlist');
            throw new Error('Failed to delete playlist');
        }

        return null;
    },
    getAlbumArtistDetail: async (args) => {
        const { query, apiClientProps } = args;

        const artistInfoRes = await subsonicApiClient(apiClientProps).getArtistInfo({
            query: {
                id: query.id,
            },
        });

        const res = await subsonicApiClient(apiClientProps).getArtist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album artist detail');
            throw new Error('Failed to get album artist detail');
        }

        const artist = res.body['subsonic-response'].artist;

        let artistInfo;
        if (artistInfoRes.status === 200) {
            artistInfo = artistInfoRes.body['subsonic-response'].artistInfo;
            fsLog.warn('Failed to get artist info');
        }

        return {
            ...subsonicNormalize.albumArtist(artist, apiClientProps.server, 300),
            albums: artist.album.map((album) =>
                subsonicNormalize.album(album, apiClientProps.server),
            ),
            similarArtists:
                artistInfo?.similarArtist?.map((artist) =>
                    subsonicNormalize.albumArtist(artist, apiClientProps.server, 300),
                ) || null,
        };
    },
    getAlbumArtistList: async (args) => {
        const { query, apiClientProps } = args;
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await subsonicApiClient(apiClientProps).getArtists({
            query: {
                musicFolderId: query.musicFolderId,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album artist list');
            throw new Error('Failed to get album artist list');
        }

        const artists = (res.body['subsonic-response'].artists?.index || []).flatMap(
            (index) => index.artist,
        );

        let results = artists;
        let totalRecordCount = artists.length;

        if (query.searchTerm) {
            const searchResults = filter(results, (artist) => {
                return artist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
            totalRecordCount = searchResults.length;
        }

        switch (query.sortBy) {
            case AlbumArtistListSort.ALBUM_COUNT:
                results = orderBy(
                    artists,
                    ['albumCount', (v) => v.name.toLowerCase()],
                    [sortOrder, 'asc'],
                );
                break;
            case AlbumArtistListSort.NAME:
                results = orderBy(artists, [(v) => v.name.toLowerCase()], [sortOrder]);
                break;
            case AlbumArtistListSort.FAVORITED:
                results = orderBy(artists, ['starred'], [sortOrder]);
                break;
            case AlbumArtistListSort.RATING:
                results = orderBy(artists, ['userRating'], [sortOrder]);
                break;
            default:
                break;
        }

        return {
            items: results.map((artist) =>
                subsonicNormalize.albumArtist(artist, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount,
        };
    },
    getAlbumArtistListCount: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getArtists({
            query: {
                musicFolderId: query.musicFolderId,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album artist list count');
            throw new Error('Failed to get album artist list count');
        }

        const artists = (res.body['subsonic-response'].artists?.index || []).flatMap(
            (index) => index.artist,
        );

        let results = artists;
        let totalRecordCount = artists.length;

        if (query.searchTerm) {
            const searchResults = filter(results, (artist) => {
                return artist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
            totalRecordCount = searchResults.length;
        }

        return totalRecordCount;
    },
    getAlbumDetail: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getAlbum({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album detail', {
                context: { id: query.id },
            });
            throw new Error('Failed to get album detail');
        }

        return subsonicNormalize.album(res.body['subsonic-response'].album, apiClientProps.server);
    },
    getAlbumList: async (args) => {
        const { query, apiClientProps } = args;

        const sortType: Record<AlbumListSort, AlbumListSortType | undefined> = {
            [AlbumListSort.RANDOM]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.RANDOM,
            [AlbumListSort.ALBUM_ARTIST]:
                SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_ARTIST,
            [AlbumListSort.PLAY_COUNT]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.FREQUENT,
            [AlbumListSort.RECENTLY_ADDED]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.NEWEST,
            [AlbumListSort.FAVORITED]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.STARRED,
            [AlbumListSort.YEAR]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.RECENT,
            [AlbumListSort.NAME]:
                SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_NAME,
            [AlbumListSort.COMMUNITY_RATING]: undefined,
            [AlbumListSort.DURATION]: undefined,
            [AlbumListSort.CRITIC_RATING]: undefined,
            [AlbumListSort.RATING]: undefined,
            [AlbumListSort.ARTIST]: undefined,
            [AlbumListSort.RECENTLY_PLAYED]: undefined,
            [AlbumListSort.RELEASE_DATE]: undefined,
            [AlbumListSort.SONG_COUNT]: undefined,
        };

        if (query.isCompilation) {
            return {
                items: [],
                startIndex: 0,
                totalRecordCount: 0,
            };
        }

        if (query.artistIds) {
            const promises = [];

            for (const artistId of query.artistIds) {
                promises.push(
                    subsonicApiClient(apiClientProps).getArtist({
                        query: {
                            id: artistId,
                        },
                    }),
                );
            }

            const artistResult = await Promise.all(promises);

            const albums = artistResult.flatMap((artist) => {
                if (artist.status !== 200) {
                    fsLog.warn('Failed to get artist detail', { context: { artist } });
                    return [];
                }

                return artist.body['subsonic-response'].artist.album;
            });

            return {
                items: albums.map((album) => subsonicNormalize.album(album, apiClientProps.server)),
                startIndex: 0,
                totalRecordCount: albums.length,
            };
        }

        const res = await subsonicApiClient(apiClientProps).getAlbumList2({
            query: {
                fromYear: query.minYear,
                genre: query.genre,
                musicFolderId: query.musicFolderId,
                offset: query.startIndex,
                size: query.limit,
                toYear: query.maxYear,
                type:
                    sortType[query.sortBy] ??
                    SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_NAME,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album list');
            throw new Error('Failed to get album list');
        }

        return {
            items: res.body['subsonic-response'].albumList2.album.map((album) =>
                subsonicNormalize.album(album, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount: null,
        };
    },
    getAlbumListCount: async (args) => {
        const { query, apiClientProps } = args;

        const sortType: Record<AlbumListSort, AlbumListSortType | undefined> = {
            [AlbumListSort.RANDOM]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.RANDOM,
            [AlbumListSort.ALBUM_ARTIST]:
                SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_ARTIST,
            [AlbumListSort.PLAY_COUNT]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.FREQUENT,
            [AlbumListSort.RECENTLY_ADDED]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.NEWEST,
            [AlbumListSort.FAVORITED]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.STARRED,
            [AlbumListSort.YEAR]: SubsonicApi.getAlbumList2.enum.AlbumListSortType.RECENT,
            [AlbumListSort.NAME]:
                SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_NAME,
            [AlbumListSort.COMMUNITY_RATING]: undefined,
            [AlbumListSort.DURATION]: undefined,
            [AlbumListSort.CRITIC_RATING]: undefined,
            [AlbumListSort.RATING]: undefined,
            [AlbumListSort.ARTIST]: undefined,
            [AlbumListSort.RECENTLY_PLAYED]: undefined,
            [AlbumListSort.RELEASE_DATE]: undefined,
            [AlbumListSort.SONG_COUNT]: undefined,
        };

        let fetchNextPage = true;
        let startIndex = 0;
        let totalRecordCount = 0;

        while (fetchNextPage) {
            const res = await subsonicApiClient(apiClientProps).getAlbumList2({
                query: {
                    fromYear: query.minYear,
                    genre: query.genre,
                    musicFolderId: query.musicFolderId,
                    offset: startIndex,
                    size: 500,
                    toYear: query.maxYear,
                    type:
                        sortType[query.sortBy] ??
                        SubsonicApi.getAlbumList2.enum.AlbumListSortType.ALPHABETICAL_BY_NAME,
                },
            });

            const headers = res.headers;

            // Navidrome returns the total count in the header
            if (headers.get('x-total-count')) {
                fetchNextPage = false;
                totalRecordCount = Number(headers.get('x-total-count'));
                break;
            }

            if (res.status !== 200) {
                fsLog.error('Failed to get album list count');
                throw new Error('Failed to get album list count');
            }

            const albumCount = res.body['subsonic-response'].albumList2.album.length;

            totalRecordCount += albumCount;
            startIndex += albumCount;

            // The max limit size for Subsonic is 500
            fetchNextPage = albumCount === 500;
        }

        return totalRecordCount;
    },
    getAlbumSongList: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getAlbum({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get album song list');
            throw new Error('Failed to get album song list');
        }

        return {
            items: res.body['subsonic-response'].album.song.map((song) =>
                subsonicNormalize.song(song, apiClientProps.server, ''),
            ),
            startIndex: 0,
            totalRecordCount: res.body['subsonic-response'].album.song.length,
        };
    },
    getArtistInfo: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getArtistInfo({
            query: {
                id: query.artistId,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get artist info', {
                context: { id: query.artistId },
            });
            throw new Error('Failed to get artist info');
        }

        return res.body['subsonic-response'].artistInfo;
    },
    getGenreList: async (args) => {
        const { query, apiClientProps } = args;
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await subsonicApiClient(apiClientProps).getGenres({});

        if (res.status !== 200) {
            fsLog.error('Failed to get genre list');
            throw new Error('Failed to get genre list');
        }

        let results = res.body['subsonic-response'].genres.genre;

        if (query.searchTerm) {
            const searchResults = filter(results, (genre) =>
                genre.value.toLowerCase().includes(query.searchTerm!.toLowerCase()),
            );

            results = searchResults;
        }

        switch (query.sortBy) {
            case GenreListSort.NAME:
                results = orderBy(results, [(v) => v.value.toLowerCase()], [sortOrder]);
                break;
            case GenreListSort.ALBUM_COUNT:
                results = orderBy(results, ['albumCount'], [sortOrder]);
                break;
            case GenreListSort.SONG_COUNT:
                results = orderBy(results, ['songCount'], [sortOrder]);
                break;
            default:
                break;
        }

        const genres = results.map(subsonicNormalize.genre);

        return {
            items: genres,
            startIndex: 0,
            totalRecordCount: genres.length,
        };
    },
    getMusicFolderList: async (args) => {
        const { apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getMusicFolders({});

        if (res.status !== 200) {
            fsLog.error('Failed to get music folder list');
            throw new Error('Failed to get music folder list');
        }

        return {
            items: res.body['subsonic-response'].musicFolders.musicFolder.map(
                subsonicNormalize.musicFolder,
            ),
            startIndex: 0,
            totalRecordCount: res.body['subsonic-response'].musicFolders.musicFolder.length,
        };
    },
    getPlaylistDetail: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getPlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get playlist detail');
            throw new Error('Failed to get playlist detail');
        }

        return subsonicNormalize.playlist(
            res.body['subsonic-response'].playlist,
            apiClientProps.server,
        );
    },
    getPlaylistList: async (args) => {
        const { query, apiClientProps } = args;
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await subsonicApiClient(apiClientProps).getPlaylists({});

        if (res.status !== 200) {
            fsLog.error('Failed to get playlist list');
            throw new Error('Failed to get playlist list');
        }

        let results = res.body['subsonic-response'].playlists.playlist;

        if (query.searchTerm) {
            const searchResults = filter(results, (playlist) => {
                return playlist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
        }

        switch (query.sortBy) {
            case PlaylistListSort.DURATION:
                results = orderBy(results, ['duration'], [sortOrder]);
                break;
            case PlaylistListSort.NAME:
                results = orderBy(results, [(v) => v.name?.toLowerCase()], [sortOrder]);
                break;
            case PlaylistListSort.OWNER:
                results = orderBy(results, [(v) => v.owner?.toLowerCase()], [sortOrder]);
                break;
            case PlaylistListSort.PUBLIC:
                results = orderBy(results, ['public'], [sortOrder]);
                break;
            case PlaylistListSort.SONG_COUNT:
                results = orderBy(results, ['songCount'], [sortOrder]);
                break;
            case PlaylistListSort.UPDATED_AT:
                results = orderBy(results, ['changed'], [sortOrder]);
                break;
            default:
                break;
        }

        return {
            items: results.map((playlist) =>
                subsonicNormalize.playlist(playlist, apiClientProps.server),
            ),
            startIndex: 0,
            totalRecordCount: res.body['subsonic-response'].playlists.playlist.length,
        };
    },
    getPlaylistListCount: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getPlaylists({});

        if (res.status !== 200) {
            fsLog.error('Failed to get playlist list count');
            throw new Error('Failed to get playlist list count');
        }

        if (query.searchTerm) {
            const searchResults = filter(
                res.body['subsonic-response'].playlists.playlist,
                (playlist) => {
                    return playlist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
                },
            );

            return searchResults.length;
        }

        return res.body['subsonic-response'].playlists.playlist.length;
    },
    getPlaylistSongList: async (args) => {
        const { query, apiClientProps } = args;
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await subsonicApiClient(apiClientProps).getPlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get playlist song list');
            throw new Error('Failed to get playlist song list');
        }

        let results = res.body['subsonic-response'].playlist.entry || [];

        if (query.searchTerm) {
            const searchResults = filter(results, (entry) => {
                return entry.title.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
        }

        if (query.sortBy) {
            switch (query.sortBy) {
                case SongListSort.ALBUM:
                    results = orderBy(
                        results,
                        [(v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                        [sortOrder, 'asc', 'asc'],
                    );
                    break;
                case SongListSort.ALBUM_ARTIST:
                    results = orderBy(
                        results,
                        ['albumArtist', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                        [sortOrder, sortOrder, 'asc', 'asc'],
                    );
                    break;
                case SongListSort.ARTIST:
                    results = orderBy(
                        results,
                        ['artist', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                        [sortOrder, sortOrder, 'asc', 'asc'],
                    );
                    break;
                case SongListSort.DURATION:
                    results = orderBy(results, ['duration'], [sortOrder]);
                    break;
                case SongListSort.FAVORITED:
                    results = orderBy(
                        results,
                        ['starred', (v) => v.title.toLowerCase()],
                        [sortOrder],
                    );
                    break;
                case SongListSort.GENRE:
                    results = orderBy(
                        results,
                        ['genre', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                        [sortOrder, sortOrder, 'asc', 'asc'],
                    );
                    break;
                case SongListSort.ID:
                    if (sortOrder === 'desc') {
                        results = reverse(results);
                    }
                    break;
                case SongListSort.NAME:
                    results = orderBy(results, [(v) => v.title.toLowerCase()], [sortOrder]);
                    break;
                case SongListSort.PLAY_COUNT:
                    results = orderBy(results, ['playCount'], [sortOrder]);
                    break;
                case SongListSort.RANDOM:
                    results = shuffle(results);
                    break;
                case SongListSort.RATING:
                    results = orderBy(
                        results,
                        ['userRating', (v) => v.title.toLowerCase()],
                        [sortOrder],
                    );
                    break;
                case SongListSort.RECENTLY_ADDED:
                    results = orderBy(results, ['created'], [sortOrder]);
                    break;
                case SongListSort.YEAR:
                    results = orderBy(
                        results,
                        ['year', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                        [sortOrder, 'asc', 'asc', 'asc'],
                    );
                    break;

                default:
                    break;
            }
        }

        return {
            items: results?.map((song) => subsonicNormalize.song(song, apiClientProps.server, '')),
            startIndex: 0,
            totalRecordCount: results?.length || 0,
        };
    },
    getRandomSongList: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getRandomSongs({
            query: {
                fromYear: query.minYear,
                genre: query.genre,
                musicFolderId: query.musicFolderId,
                size: query.limit,
                toYear: query.maxYear,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get random songs');
            throw new Error('Failed to get random songs');
        }

        return {
            items: res.body['subsonic-response'].randomSongs?.song?.map((song) =>
                subsonicNormalize.song(song, apiClientProps.server, ''),
            ),
            startIndex: 0,
            totalRecordCount: null,
        };
    },
    getSongDetail: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getSong({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get song detail');
            throw new Error('Failed to get song detail');
        }

        return subsonicNormalize.song(
            res.body['subsonic-response'].song,
            apiClientProps.server,
            '',
        );
    },
    getSongList: async (args) => {
        const { query, apiClientProps } = args;

        const fromAlbumPromises = [];
        const artistDetailPromises = [];
        let results: any[] = [];

        if (query.genreId) {
            const res = await subsonicApiClient(apiClientProps).getSongsByGenre({
                query: {
                    count: query.limit,
                    genre: query.genreId,
                    musicFolderId: query.musicFolderId,
                    offset: query.startIndex,
                },
            });

            if (res.status !== 200) {
                fsLog.error('Failed to get song list');
                throw new Error('Failed to get song list');
            }

            return {
                items: res.body['subsonic-response'].songsByGenre.song.map((song) =>
                    subsonicNormalize.song(song, apiClientProps.server, ''),
                ),
                startIndex: 0,
                totalRecordCount: null,
            };
        }

        if (query.albumIds || query.artistIds) {
            if (query.albumIds) {
                for (const albumId of query.albumIds) {
                    fromAlbumPromises.push(
                        subsonicApiClient(apiClientProps).getAlbum({
                            query: {
                                id: albumId,
                            },
                        }),
                    );
                }
            }

            if (query.artistIds) {
                for (const artistId of query.artistIds) {
                    artistDetailPromises.push(
                        subsonicApiClient(apiClientProps).getArtist({
                            query: {
                                id: artistId,
                            },
                        }),
                    );
                }

                const artistResult = await Promise.all(artistDetailPromises);

                const albums = artistResult.flatMap((artist) => {
                    if (artist.status !== 200) {
                        fsLog.warn('Failed to get artist detail', { context: { artist } });
                        return [];
                    }

                    return artist.body['subsonic-response'].artist.album;
                });

                const albumIds = albums.map((album) => album.id);

                for (const albumId of albumIds) {
                    fromAlbumPromises.push(
                        subsonicApiClient(apiClientProps).getAlbum({
                            query: {
                                id: albumId,
                            },
                        }),
                    );
                }
            }

            if (fromAlbumPromises) {
                const albumsResult = await Promise.all(fromAlbumPromises);

                results = albumsResult.flatMap((album) => {
                    if (album.status !== 200) {
                        fsLog.warn('Failed to get album detail', { context: { album } });
                        return [];
                    }

                    return album.body['subsonic-response'].album.song;
                });
            }

            return {
                items: results.map((song) =>
                    subsonicNormalize.song(song, apiClientProps.server, ''),
                ),
                startIndex: 0,
                totalRecordCount: results.length,
            };
        }

        const res = await subsonicApiClient(apiClientProps).search3({
            query: {
                albumCount: 0,
                albumOffset: 0,
                artistCount: 0,
                artistOffset: 0,
                query: query.searchTerm || '""',
                songCount: query.limit,
                songOffset: query.startIndex,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get song list');
            throw new Error('Failed to get song list');
        }

        return {
            items:
                res.body['subsonic-response'].searchResult3?.song?.map((song) =>
                    subsonicNormalize.song(song, apiClientProps.server, ''),
                ) || [],
            startIndex: 0,
            totalRecordCount: null,
        };
    },
    getSongListCount: async (args) => {
        const { query, apiClientProps } = args;

        let fetchNextPage = true;
        let startIndex = 0;

        let fetchNextSection = true;
        let sectionIndex = 0;

        if (query.genreId) {
            let totalRecordCount = 0;
            while (fetchNextSection) {
                const res = await subsonicApiClient(apiClientProps).getSongsByGenre({
                    query: {
                        count: 1,
                        genre: query.genreId,
                        musicFolderId: query.musicFolderId,
                        offset: sectionIndex,
                    },
                });

                if (res.status !== 200) {
                    fsLog.error('Failed to get song list count');
                    throw new Error('Failed to get song list count');
                }

                const numberOfResults =
                    res.body['subsonic-response'].songsByGenre.song?.length || 0;

                if (numberOfResults !== 1) {
                    fetchNextSection = false;
                    startIndex = sectionIndex === 0 ? 0 : sectionIndex - 5000;
                    break;
                } else {
                    sectionIndex += 5000;
                }
            }

            while (fetchNextPage) {
                const res = await subsonicApiClient(apiClientProps).getSongsByGenre({
                    query: {
                        count: 500,
                        genre: query.genreId,
                        musicFolderId: query.musicFolderId,
                        offset: startIndex,
                    },
                });

                if (res.status !== 200) {
                    fsLog.error('Failed to get song list count');
                    throw new Error('Failed to get song list count');
                }

                const numberOfResults =
                    res.body['subsonic-response'].songsByGenre.song?.length || 0;

                totalRecordCount = startIndex + numberOfResults;
                startIndex += numberOfResults;

                fetchNextPage = numberOfResults === 500;
            }

            return totalRecordCount;
        }

        let totalRecordCount = 0;

        while (fetchNextSection) {
            const res = await subsonicApiClient(apiClientProps).search3({
                query: {
                    albumCount: 0,
                    albumOffset: 0,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '""',
                    songCount: 1,
                    songOffset: sectionIndex,
                },
            });

            if (res.status !== 200) {
                fsLog.error('Failed to get song list count');
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = res.body['subsonic-response'].searchResult3.song?.length || 0;

            // Check each batch of 5000 songs to check for data
            sectionIndex += 5000;
            fetchNextSection = numberOfResults === 1;

            if (!fetchNextSection) {
                // fetchNextBlock will be false on the next loop so we need to subtract 5000 * 2
                startIndex = sectionIndex - 10000;
            }
        }

        while (fetchNextPage) {
            const res = await subsonicApiClient(apiClientProps).search3({
                query: {
                    albumCount: 0,
                    albumOffset: 0,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '""',
                    songCount: 500,
                    songOffset: startIndex,
                },
            });

            if (res.status !== 200) {
                fsLog.error('Failed to get song list count');
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = res.body['subsonic-response'].searchResult3.song?.length || 0;

            totalRecordCount = startIndex + numberOfResults;
            startIndex += numberOfResults;

            // The max limit size for Subsonic is 500
            fetchNextPage = numberOfResults === 500;
        }

        return totalRecordCount;
    },
    getTopSongs: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getTopSongs({
            query: {
                artist: query.artist,
                count: query.limit,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to get top songs', {
                context: { artist: query.artist },
            });
            throw new Error('Failed to get top songs');
        }

        return {
            items:
                res.body['subsonic-response'].topSongs?.song?.map((song) =>
                    subsonicNormalize.song(song, apiClientProps.server, ''),
                ) || [],
            startIndex: 0,
            totalRecordCount: null,
        };
    },
    scrobble: async (args) => {
        const { query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).scrobble({
            query: {
                id: query.id,
                submission: query.submission,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to scrobble', {
                context: {
                    id: query.id,
                },
            });
            throw new Error('Failed to scrobble');
        }

        return null;
    },
    search: async (args) => {
        const { query, apiClientProps } = args;

        const searchQuery = {
            albumCount: query.albumLimit,
            albumOffset: query.albumStartIndex,
            artistCount: query.albumArtistLimit,
            artistOffset: query.albumArtistStartIndex,
            query: query.query,
            songCount: query.songLimit,
            songOffset: query.songStartIndex,
        };

        const res = await subsonicApiClient(apiClientProps).search3({
            query: searchQuery,
        });

        if (res.status !== 200) {
            fsLog.error('Failed to search', {
                context: searchQuery,
            });
            throw new Error('Failed to search');
        }

        return {
            albumArtists: res.body['subsonic-response'].searchResult3?.artist?.map((artist) =>
                subsonicNormalize.albumArtist(artist, apiClientProps.server),
            ),
            albums: res.body['subsonic-response'].searchResult3?.album?.map((album) =>
                subsonicNormalize.album(album, apiClientProps.server),
            ),
            songs: res.body['subsonic-response'].searchResult3?.song?.map((song) =>
                subsonicNormalize.song(song, apiClientProps.server, ''),
            ),
        };
    },
    setRating: async (args) => {
        const { query, apiClientProps } = args;

        const itemIds = query.item.map((item) => item.id);

        for (const id of itemIds) {
            await subsonicApiClient(apiClientProps).setRating({
                query: {
                    id,
                    rating: query.rating,
                },
            });
        }

        return null;
    },
    updatePlaylist: async (args) => {
        const { body, query, apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).updatePlaylist({
            query: {
                comment: body.comment,
                name: body.name,
                playlistId: query.id,
                public: body.public,
            },
        });

        if (res.status !== 200) {
            fsLog.error('Failed to update playlist');
            throw new Error('Failed to update playlist');
        }

        return null;
    },
};
