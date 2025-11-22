import type { ServerInferResponses } from '@ts-rest/core';

import dayjs from 'dayjs';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import md5 from 'md5';
import { z } from 'zod';

import { contract, ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { randomString } from '/@/renderer/utils';
import { ssNormalize } from '/@/shared/api/subsonic/subsonic-normalize';
import {
    AlbumListSortType,
    ssType,
    SubsonicExtensions,
} from '/@/shared/api/subsonic/subsonic-types';
import {
    AlbumListSort,
    GenreListSort,
    InternalControllerEndpoint,
    LibraryItem,
    PlaylistListSort,
    Song,
    sortAlbumArtistList,
    sortAlbumList,
    SortOrder,
    sortSongList,
} from '/@/shared/types/domain-types';
import { ServerFeatures } from '/@/shared/types/features-types';

const ALBUM_LIST_SORT_MAPPING: Record<AlbumListSort, AlbumListSortType | undefined> = {
    [AlbumListSort.ALBUM_ARTIST]: AlbumListSortType.ALPHABETICAL_BY_ARTIST,
    [AlbumListSort.ARTIST]: undefined,
    [AlbumListSort.COMMUNITY_RATING]: undefined,
    [AlbumListSort.CRITIC_RATING]: undefined,
    [AlbumListSort.DURATION]: undefined,
    [AlbumListSort.EXPLICIT_STATUS]: undefined,
    [AlbumListSort.FAVORITED]: AlbumListSortType.STARRED,
    [AlbumListSort.NAME]: AlbumListSortType.ALPHABETICAL_BY_NAME,
    [AlbumListSort.PLAY_COUNT]: AlbumListSortType.FREQUENT,
    [AlbumListSort.RANDOM]: AlbumListSortType.RANDOM,
    [AlbumListSort.RATING]: undefined,
    [AlbumListSort.RECENTLY_ADDED]: AlbumListSortType.NEWEST,
    [AlbumListSort.RECENTLY_PLAYED]: AlbumListSortType.RECENT,
    [AlbumListSort.RELEASE_DATE]: AlbumListSortType.BY_YEAR,
    [AlbumListSort.SONG_COUNT]: undefined,
    [AlbumListSort.YEAR]: AlbumListSortType.BY_YEAR,
};

const MAX_SUBSONIC_ITEMS = 500;
// A trick to skip ahead 10x
const SUBSONIC_FAST_BATCH_SIZE = MAX_SUBSONIC_ITEMS * 10;

export const SubsonicController: InternalControllerEndpoint = {
    addToPlaylist: async ({ apiClientProps, body, query }) => {
        const res = await ssApiClient(apiClientProps).updatePlaylist({
            query: {
                playlistId: query.id,
                songIdToAdd: body.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to add to playlist');
        }

        return null;
    },
    authenticate: async (url, body) => {
        let credential: string;
        let credentialParams: {
            p?: string;
            s?: string;
            t?: string;
            u: string;
        };

        const cleanServerUrl = `${url.replace(/\/$/, '')}/rest`;

        if (body.legacy) {
            credential = `u=${encodeURIComponent(body.username)}&p=${encodeURIComponent(body.password)}`;
            credentialParams = {
                p: body.password,
                u: body.username,
            };
        } else {
            const salt = randomString(12);
            const hash = md5(body.password + salt);

            credential = `u=${encodeURIComponent(body.username)}&s=${encodeURIComponent(salt)}&t=${encodeURIComponent(hash)}`;
            credentialParams = {
                s: salt,
                t: hash,
                u: body.username,
            };
        }

        const resp = await ssApiClient({ server: null, url: cleanServerUrl }).authenticate({
            query: {
                c: 'Feishin',
                f: 'json',
                v: '1.13.0',
                ...credentialParams,
            },
        });

        if (resp.status !== 200) {
            throw new Error('Failed to log in');
        }

        return {
            credential,
            userId: null,
            username: body.username,
        };
    },
    createFavorite: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).createFavorite({
            query: {
                albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
                artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
                id: query.type === LibraryItem.SONG ? query.id : undefined,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to create favorite');
        }

        return null;
    },
    createPlaylist: async ({ apiClientProps, body }) => {
        const res = await ssApiClient(apiClientProps).createPlaylist({
            query: {
                name: body.name,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to create playlist');
        }

        return {
            id: res.body.playlist.id.toString(),
            name: res.body.playlist.name,
        };
    },
    deleteFavorite: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).removeFavorite({
            query: {
                albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
                artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
                id: query.type === LibraryItem.SONG ? query.id : undefined,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to delete favorite');
        }

        return null;
    },
    deletePlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).deletePlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to delete playlist');
        }

        return null;
    },
    getAlbumArtistDetail: async (args) => {
        const { apiClientProps, query } = args;

        const artistInfoRes = await ssApiClient(apiClientProps).getArtistInfo({
            query: {
                id: query.id,
            },
        });

        const res = await ssApiClient(apiClientProps).getArtist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist detail');
        }

        const artist = res.body.artist;

        let artistInfo;
        if (artistInfoRes.status === 200) {
            artistInfo = artistInfoRes.body.artistInfo;
        }

        return {
            ...ssNormalize.albumArtist(artist, apiClientProps.server, 300),
            albums: artist.album?.map((album) => ssNormalize.album(album, apiClientProps.server)),
            similarArtists:
                artistInfo?.similarArtist?.map((artist) =>
                    ssNormalize.albumArtist(artist, apiClientProps.server, 300),
                ) || null,
        };
    },
    getAlbumArtistList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getArtists({
            query: {
                musicFolderId: query.musicFolderId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        const artists = (res.body.artists?.index || []).flatMap((index) => index.artist);

        let results = artists.map((artist) =>
            ssNormalize.albumArtist(artist, apiClientProps.server, 300),
        );

        if (query.searchTerm) {
            const searchResults = filter(results, (artist) => {
                return artist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
        }

        if (query.sortBy) {
            results = sortAlbumArtistList(results, query.sortBy, query.sortOrder);
        }

        return {
            items: results,
            startIndex: query.startIndex,
            totalRecordCount: results?.length || 0,
        };
    },
    getAlbumArtistListCount: (args) =>
        SubsonicController.getAlbumArtistList({
            ...args,
            query: { ...args.query, startIndex: 0 },
        }).then((res) => res!.totalRecordCount!),
    getAlbumDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getAlbum({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album detail');
        }

        return ssNormalize.album(res.body.album, apiClientProps.server);
    },
    getAlbumList: async (args) => {
        const { apiClientProps, query } = args;

        if (query.searchTerm) {
            const res = await ssApiClient(apiClientProps).search3({
                query: {
                    albumCount: query.limit,
                    albumOffset: query.startIndex,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '',
                    songCount: 0,
                    songOffset: 0,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get album list');
            }

            const results =
                res.body.searchResult3?.album?.map((album) =>
                    ssNormalize.album(album, apiClientProps.server),
                ) || [];

            return {
                items: results,
                startIndex: query.startIndex,
                totalRecordCount: null,
            };
        }

        let type = ALBUM_LIST_SORT_MAPPING[query.sortBy] ?? AlbumListSortType.ALPHABETICAL_BY_NAME;

        if (query.artistIds) {
            const promises: Promise<ServerInferResponses<typeof contract.getArtist>>[] = [];

            for (const artistId of query.artistIds) {
                promises.push(
                    ssApiClient(apiClientProps).getArtist({
                        query: {
                            id: artistId,
                        },
                    }),
                );
            }

            const artistResult = await Promise.all(promises);

            const albums = artistResult.flatMap((artist) => {
                if (artist.status !== 200) {
                    return [];
                }

                return artist.body.artist.album ?? [];
            });

            const items = albums.map((album) => ssNormalize.album(album, apiClientProps.server));

            return {
                items: sortAlbumList(items, query.sortBy, query.sortOrder),
                startIndex: 0,
                totalRecordCount: albums.length,
            };
        }

        if (query.favorite) {
            const res = await ssApiClient(apiClientProps).getStarred({
                query: {
                    musicFolderId: query.musicFolderId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get album list');
            }

            const results =
                res.body.starred?.album?.map((album) =>
                    ssNormalize.album(album, apiClientProps.server),
                ) || [];

            return {
                items: sortAlbumList(results, query.sortBy, query.sortOrder),
                startIndex: 0,
                totalRecordCount: res.body.starred?.album?.length || 0,
            };
        }

        if (query.genres?.length) {
            type = AlbumListSortType.BY_GENRE;
        }

        if (query.minYear || query.maxYear) {
            type = AlbumListSortType.BY_YEAR;
        }

        let fromYear: number | undefined;
        let toYear: number | undefined;

        if (query.minYear) {
            fromYear = query.minYear;
            toYear = dayjs().year();
        }

        if (query.maxYear) {
            toYear = query.maxYear;

            if (!query.minYear) {
                fromYear = 0;
            }
        }

        if (type === AlbumListSortType.BY_YEAR && !fromYear && !toYear) {
            if (query.sortOrder === SortOrder.ASC) {
                fromYear = 0;
                toYear = dayjs().year();
            } else {
                fromYear = dayjs().year();
                toYear = 0;
            }
        }

        const res = await ssApiClient(apiClientProps).getAlbumList2({
            query: {
                fromYear,
                genre: query.genres?.length ? query.genres[0] : undefined,
                musicFolderId: query.musicFolderId,
                offset: query.startIndex,
                size: query.limit,
                toYear,
                type,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album list');
        }

        return {
            items:
                res.body.albumList2.album?.map((album) =>
                    ssNormalize.album(album, apiClientProps.server, 300),
                ) || [],
            startIndex: query.startIndex,
            totalRecordCount: null,
        };
    },
    getAlbumListCount: async (args) => {
        const { apiClientProps, query } = args;

        if (query.searchTerm) {
            let fetchNextPage = true;
            let startIndex = 0;
            let totalRecordCount = 0;

            while (fetchNextPage) {
                const res = await ssApiClient(apiClientProps).search3({
                    query: {
                        albumCount: MAX_SUBSONIC_ITEMS,
                        albumOffset: startIndex,
                        artistCount: 0,
                        artistOffset: 0,
                        query: query.searchTerm || '',
                        songCount: 0,
                        songOffset: 0,
                    },
                });

                if (res.status !== 200) {
                    throw new Error('Failed to get album list count');
                }

                const albumCount = (res.body.searchResult3?.album || [])?.length;

                totalRecordCount += albumCount;
                startIndex += albumCount;

                fetchNextPage = albumCount === MAX_SUBSONIC_ITEMS;
            }

            return totalRecordCount;
        }

        if (query.artistIds) {
            const promises: Promise<ServerInferResponses<typeof contract.getArtist>>[] = [];

            for (const artistId of query.artistIds) {
                promises.push(
                    ssApiClient(apiClientProps).getArtist({
                        query: {
                            id: artistId,
                        },
                    }),
                );
            }

            const artistResult = await Promise.all(promises);

            const albums = artistResult.reduce((total: number, artist) => {
                if (artist.status !== 200) {
                    return 0;
                }

                const length = artist.body.artist.album?.length ?? 0;
                return length + total;
            }, 0);

            return albums;
        }

        if (query.favorite) {
            const res = await ssApiClient(apiClientProps).getStarred({
                query: {
                    musicFolderId: query.musicFolderId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get album list');
            }

            return (res.body.starred?.album || []).length || 0;
        }

        let type = AlbumListSortType.ALPHABETICAL_BY_NAME;

        let fetchNextPage = true;
        let startIndex = 0;
        let totalRecordCount = 0;

        if (query.genres?.length) {
            type = AlbumListSortType.BY_GENRE;
        }

        if (query.minYear || query.maxYear) {
            type = AlbumListSortType.BY_YEAR;
        }

        let fromYear: number | undefined;
        let toYear: number | undefined;

        if (query.minYear) {
            fromYear = query.minYear;
            toYear = dayjs().year();
        }

        if (query.maxYear) {
            toYear = query.maxYear;

            if (!query.minYear) {
                fromYear = 0;
            }
        }

        while (fetchNextPage) {
            const res = await ssApiClient(apiClientProps).getAlbumList2({
                query: {
                    fromYear,
                    genre: query.genres?.length ? query.genres[0] : undefined,
                    musicFolderId: query.musicFolderId,
                    offset: startIndex,
                    size: MAX_SUBSONIC_ITEMS,
                    toYear,
                    type,
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
                throw new Error('Failed to get album list count');
            }

            const albumCount = res.body.albumList2.album.length;

            totalRecordCount += albumCount;
            startIndex += albumCount;

            fetchNextPage = albumCount === MAX_SUBSONIC_ITEMS;
        }

        return totalRecordCount;
    },
    getArtistList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getArtists({
            query: {
                musicFolderId: query.musicFolderId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get artist list');
        }

        let artists = (res.body.artists?.index || []).flatMap((index) => index.artist);
        if (query.role) {
            artists = artists.filter(
                (artist) => !artist.roles || artist.roles.includes(query.role!),
            );
        }

        let results = artists.map((artist) =>
            ssNormalize.albumArtist(artist, apiClientProps.server, 300),
        );

        if (query.searchTerm) {
            const searchResults = filter(results, (artist) => {
                return artist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
        }

        if (query.sortBy) {
            results = sortAlbumArtistList(results, query.sortBy, query.sortOrder);
        }

        return {
            items: results,
            startIndex: query.startIndex,
            totalRecordCount: results?.length || 0,
        };
    },
    getArtistListCount: async (args) =>
        SubsonicController.getArtistList({
            ...args,
            query: { ...args.query, startIndex: 0 },
        }).then((res) => res!.totalRecordCount!),
    getDownloadUrl: (args) => {
        const { apiClientProps, query } = args;

        return (
            `${apiClientProps.server?.url}/rest/download.view` +
            `?id=${query.id}` +
            `&${apiClientProps.server?.credential}` +
            '&v=1.13.0' +
            '&c=Feishin'
        );
    },
    getGenreList: async ({ apiClientProps, query }) => {
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await ssApiClient(apiClientProps).getGenres({});

        if (res.status !== 200) {
            throw new Error('Failed to get genre list');
        }

        let results = res.body.genres?.genre || [];

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
            default:
                break;
        }

        const genres = results.map((genre) => ssNormalize.genre(genre, apiClientProps.server));

        return {
            items: genres,
            startIndex: 0,
            totalRecordCount: genres.length,
        };
    },
    getMusicFolderList: async (args) => {
        const { apiClientProps } = args;

        const res = await ssApiClient(apiClientProps).getMusicFolderList({});

        if (res.status !== 200) {
            throw new Error('Failed to get music folder list');
        }

        return {
            items: res.body.musicFolders.musicFolder.map((folder) => ({
                id: folder.id.toString(),
                name: folder.name,
            })),
            startIndex: 0,
            totalRecordCount: res.body.musicFolders.musicFolder.length,
        };
    },
    getPlaylistDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getPlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist detail');
        }

        return ssNormalize.playlist(res.body.playlist, apiClientProps.server);
    },
    getPlaylistList: async ({ apiClientProps, query }) => {
        const sortOrder = query.sortOrder.toLowerCase() as 'asc' | 'desc';

        const res = await ssApiClient(apiClientProps).getPlaylists({});

        if (res.status !== 200) {
            throw new Error('Failed to get playlist list');
        }

        let results = res.body.playlists?.playlist || [];

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
            items: results.map((playlist) => ssNormalize.playlist(playlist, apiClientProps.server)),
            startIndex: 0,
            totalRecordCount: results.length,
        };
    },
    getPlaylistListCount: async ({ apiClientProps, query }) => {
        const res = await ssApiClient(apiClientProps).getPlaylists({});

        if (res.status !== 200) {
            throw new Error('Failed to get playlist list');
        }

        let results = res.body.playlists?.playlist || [];

        if (query.searchTerm) {
            const searchResults = filter(results, (playlist) => {
                return playlist.name.toLowerCase().includes(query.searchTerm!.toLowerCase());
            });

            results = searchResults;
        }

        return results.length;
    },
    getPlaylistSongList: async ({ apiClientProps, query }) => {
        const res = await ssApiClient(apiClientProps).getPlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist song list');
        }

        const items =
            res.body.playlist.entry?.map((song) => ssNormalize.song(song, apiClientProps.server)) ||
            [];

        return {
            items,
            startIndex: 0,
            totalRecordCount: items.length,
        };
    },
    getRandomSongList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getRandomSongList({
            query: {
                fromYear: query.minYear,
                genre: query.genre,
                musicFolderId: query.musicFolderId,
                size: query.limit,
                toYear: query.maxYear,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get random songs');
        }

        const results = res.body.randomSongs?.song || [];

        return {
            items: results.map((song) => ssNormalize.song(song, apiClientProps.server)),
            startIndex: 0,
            totalRecordCount: res.body.randomSongs?.song?.length || 0,
        };
    },
    getRoles: async (args) => {
        const { apiClientProps } = args;

        const res = await ssApiClient(apiClientProps).getArtists({});

        if (res.status !== 200) {
            throw new Error('Failed to get artist list');
        }

        const roles = new Set<string>();

        for (const index of res.body.artists?.index || []) {
            for (const artist of index.artist) {
                for (const role of artist.roles || []) {
                    roles.add(role);
                }
            }
        }

        const final: Array<string | { label: string; value: string }> = Array.from(roles).sort();
        // Always add 'all artist' filter, even if there are no other roles
        // This is relevant when switching from a server which has roles to one with
        // no roles.
        final.splice(0, 0, { label: 'all artists', value: '' });
        return final;
    },
    getServerInfo: async (args) => {
        const { apiClientProps } = args;

        const ping = await ssApiClient(apiClientProps).ping();

        if (ping.status !== 200) {
            throw new Error('Failed to ping server');
        }

        const features: ServerFeatures = {};

        if (!ping.body.openSubsonic || !ping.body.serverVersion) {
            return { features, version: ping.body.version };
        }

        const res = await ssApiClient(apiClientProps).getServerInfo();

        if (res.status !== 200) {
            throw new Error('Failed to get server extensions');
        }

        const subsonicFeatures: Record<string, number[]> = {};
        if (Array.isArray(res.body.openSubsonicExtensions)) {
            for (const extension of res.body.openSubsonicExtensions) {
                subsonicFeatures[extension.name] = extension.versions;
            }
        }

        if (subsonicFeatures[SubsonicExtensions.SONG_LYRICS]) {
            features.lyricsMultipleStructured = [1];
        }

        return { features, id: apiClientProps.server?.id, version: ping.body.serverVersion };
    },
    getSimilarSongs: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getSimilarSongs({
            query: {
                count: query.count,
                id: query.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get similar songs');
        }

        if (!res.body.similarSongs?.song) {
            return [];
        }

        return res.body.similarSongs.song.reduce<Song[]>((acc, song) => {
            if (song.id !== query.songId) {
                acc.push(ssNormalize.song(song, apiClientProps.server));
            }

            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getSong({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return ssNormalize.song(res.body.song, apiClientProps.server);
    },
    getSongList: async ({ apiClientProps, query }) => {
        const fromAlbumPromises: Promise<ServerInferResponses<typeof contract.getAlbum>>[] = [];
        const artistDetailPromises: Promise<ServerInferResponses<typeof contract.getArtist>>[] = [];

        if (query.searchTerm) {
            const res = await ssApiClient(apiClientProps).search3({
                query: {
                    albumCount: 0,
                    albumOffset: 0,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '',
                    songCount: query.limit,
                    songOffset: query.startIndex,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list');
            }

            return {
                items:
                    res.body.searchResult3?.song?.map((song) =>
                        ssNormalize.song(song, apiClientProps.server),
                    ) || [],
                startIndex: query.startIndex,
                totalRecordCount: null,
            };
        }

        if (query.genreIds) {
            const res = await ssApiClient(apiClientProps).getSongsByGenre({
                query: {
                    count: query.limit,
                    genre: query.genreIds[0],
                    musicFolderId: query.musicFolderId,
                    offset: query.startIndex,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list');
            }

            const results = res.body.songsByGenre?.song || [];

            return {
                items: results.map((song) => ssNormalize.song(song, apiClientProps.server)) || [],
                startIndex: 0,
                totalRecordCount: null,
            };
        }

        if (query.favorite) {
            const res = await ssApiClient(apiClientProps).getStarred({
                query: {
                    musicFolderId: query.musicFolderId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list');
            }

            const results =
                (res.body.starred?.song || []).map((song) =>
                    ssNormalize.song(song, apiClientProps.server),
                ) || [];

            return {
                items: sortSongList(results, query.sortBy, query.sortOrder),
                startIndex: 0,
                totalRecordCount: (res.body.starred?.song || []).length || 0,
            };
        }

        const artistIds = query.albumArtistIds || query.artistIds;

        if (query.albumIds || artistIds) {
            if (query.albumIds) {
                for (const albumId of query.albumIds) {
                    fromAlbumPromises.push(
                        ssApiClient(apiClientProps).getAlbum({
                            query: {
                                id: albumId,
                            },
                        }),
                    );
                }
            }

            if (artistIds) {
                for (const artistId of artistIds) {
                    artistDetailPromises.push(
                        ssApiClient(apiClientProps).getArtist({
                            query: {
                                id: artistId,
                            },
                        }),
                    );
                }

                const artistResult = await Promise.all(artistDetailPromises);

                const albums = artistResult.flatMap((artist) => {
                    if (artist.status !== 200) {
                        return [];
                    }

                    return artist.body.artist.album ?? [];
                });

                const albumIds = albums.map((album) => album.id);

                for (const albumId of albumIds) {
                    fromAlbumPromises.push(
                        ssApiClient(apiClientProps).getAlbum({
                            query: {
                                id: albumId.toString(),
                            },
                        }),
                    );
                }
            }

            let results: z.infer<typeof ssType._response.song>[] = [];

            if (fromAlbumPromises) {
                const albumsResult = await Promise.all(fromAlbumPromises);

                results = albumsResult.flatMap((album) => {
                    if (album.status !== 200) {
                        return [];
                    }

                    return album.body.album.song;
                });
            }

            return {
                items: results.map((song) => ssNormalize.song(song, apiClientProps.server)),
                startIndex: 0,
                totalRecordCount: results.length,
            };
        }

        const res = await ssApiClient(apiClientProps).search3({
            query: {
                albumCount: 0,
                albumOffset: 0,
                artistCount: 0,
                artistOffset: 0,
                query: query.searchTerm || '',
                songCount: query.limit,
                songOffset: query.startIndex,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song list');
        }

        return {
            items:
                res.body.searchResult3?.song?.map((song) =>
                    ssNormalize.song(song, apiClientProps.server),
                ) || [],
            startIndex: 0,
            totalRecordCount: null,
        };
    },
    getSongListCount: async (args) => {
        const { apiClientProps, query } = args;

        let fetchNextPage = true;
        let startIndex = 0;

        let fetchNextSection = true;
        let sectionIndex = 0;

        if (query.searchTerm) {
            let fetchNextPage = true;
            let startIndex = 0;
            let totalRecordCount = 0;

            while (fetchNextPage) {
                const res = await ssApiClient(apiClientProps).search3({
                    query: {
                        albumCount: 0,
                        albumOffset: 0,
                        artistCount: 0,
                        artistOffset: 0,
                        query: query.searchTerm || '',
                        songCount: MAX_SUBSONIC_ITEMS,
                        songOffset: startIndex,
                    },
                });

                if (res.status !== 200) {
                    throw new Error('Failed to get song list count');
                }

                const songCount = (res.body.searchResult3?.song || []).length || 0;

                totalRecordCount += songCount;
                startIndex += songCount;

                fetchNextPage = songCount === MAX_SUBSONIC_ITEMS;
            }

            return totalRecordCount;
        }

        if (query.genreIds) {
            let totalRecordCount = 0;

            // Rather than just do `getSongsByGenre` by groups of 500, instead
            // jump the offset 10x, and then backtrack on the last chunk. This improves
            // performance for extremely large libraries
            while (fetchNextSection) {
                const res = await ssApiClient(apiClientProps).getSongsByGenre({
                    query: {
                        count: 1,
                        genre: query.genreIds[0],
                        musicFolderId: query.musicFolderId,
                        offset: sectionIndex,
                    },
                });

                if (res.status !== 200) {
                    throw new Error('Failed to get song list count');
                }

                const numberOfResults = (res.body.songsByGenre?.song || []).length || 0;

                if (numberOfResults !== 1) {
                    fetchNextSection = false;
                    startIndex = sectionIndex === 0 ? 0 : sectionIndex - SUBSONIC_FAST_BATCH_SIZE;
                    break;
                } else {
                    sectionIndex += SUBSONIC_FAST_BATCH_SIZE;
                }
            }

            while (fetchNextPage) {
                const res = await ssApiClient(apiClientProps).getSongsByGenre({
                    query: {
                        count: MAX_SUBSONIC_ITEMS,
                        genre: query.genreIds[0],
                        musicFolderId: query.musicFolderId,
                        offset: startIndex,
                    },
                });

                if (res.status !== 200) {
                    throw new Error('Failed to get song list count');
                }

                const numberOfResults = (res.body.songsByGenre?.song || []).length || 0;

                totalRecordCount = startIndex + numberOfResults;
                startIndex += numberOfResults;

                fetchNextPage = numberOfResults === MAX_SUBSONIC_ITEMS;
            }

            return totalRecordCount;
        }

        if (query.favorite) {
            const res = await ssApiClient(apiClientProps).getStarred({
                query: {
                    musicFolderId: query.musicFolderId,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list');
            }

            return (res.body.starred?.song || []).length || 0;
        }

        let totalRecordCount = 0;

        // Rather than just do `search3` by groups of 500, instead
        // jump the offset 10x, and then backtrack on the last chunk. This improves
        // performance for extremely large libraries
        while (fetchNextSection) {
            const res = await ssApiClient(apiClientProps).search3({
                query: {
                    albumCount: 0,
                    albumOffset: 0,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '',
                    songCount: 1,
                    songOffset: sectionIndex,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = (res.body.searchResult3?.song || []).length || 0;

            if (numberOfResults !== 1) {
                fetchNextSection = false;
                startIndex = sectionIndex === 0 ? 0 : sectionIndex - SUBSONIC_FAST_BATCH_SIZE;
                break;
            } else {
                sectionIndex += SUBSONIC_FAST_BATCH_SIZE;
            }
        }

        while (fetchNextPage) {
            const res = await ssApiClient(apiClientProps).search3({
                query: {
                    albumCount: 0,
                    albumOffset: 0,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '',
                    songCount: MAX_SUBSONIC_ITEMS,
                    songOffset: startIndex,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = (res.body.searchResult3?.song || []).length || 0;

            totalRecordCount = startIndex + numberOfResults;
            startIndex += numberOfResults;

            fetchNextPage = numberOfResults === MAX_SUBSONIC_ITEMS;
        }

        return totalRecordCount;
    },
    getStreamUrl: ({ apiClientProps: { server }, query }) => {
        const { bitrate, format, id, transcode } = query;
        let url = `${server?.url}/rest/stream.view?id=${id}&v=1.13.0&c=Feishin&${server?.credential}`;

        if (transcode) {
            if (format) {
                url += `&format=${format}`;
            }
            if (bitrate !== undefined) {
                url += `&maxBitRate=${bitrate}`;
            }
        }

        return url;
    },
    getStructuredLyrics: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getStructuredLyrics({
            query: {
                id: query.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get structured lyrics');
        }

        const lyrics = res.body.lyricsList?.structuredLyrics;

        if (!lyrics) {
            return [];
        }

        return lyrics.map((lyric) => {
            const baseLyric = {
                artist: lyric.displayArtist || '',
                lang: lyric.lang,
                name: lyric.displayTitle || '',
                remote: false,
                source: apiClientProps.server?.name || 'music server',
            };

            if (lyric.synced) {
                return {
                    ...baseLyric,
                    lyrics: lyric.line.map((line) => [line.start!, line.value]),
                    synced: true,
                };
            }
            return {
                ...baseLyric,
                lyrics: lyric.line.map((line) => [line.value]).join('\n'),
                synced: false,
            };
        });
    },
    getTopSongs: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).getTopSongsList({
            query: {
                artist: query.artist,
                count: query.limit,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get top songs');
        }

        return {
            items:
                res.body.topSongs?.song?.map((song) =>
                    ssNormalize.song(song, apiClientProps.server),
                ) || [],
            startIndex: 0,
            totalRecordCount: res.body.topSongs?.song?.length || 0,
        };
    },
    removeFromPlaylist: async ({ apiClientProps, query }) => {
        const res = await ssApiClient(apiClientProps).updatePlaylist({
            query: {
                playlistId: query.id,
                songIndexToRemove: query.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to add to playlist');
        }

        return null;
    },
    scrobble: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).scrobble({
            query: {
                id: query.id,
                submission: query.submission,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to scrobble');
        }

        return null;
    },

    search: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ssApiClient(apiClientProps).search3({
            query: {
                albumCount: query.albumLimit,
                albumOffset: query.albumStartIndex,
                artistCount: query.albumArtistLimit,
                artistOffset: query.albumArtistStartIndex,
                query: query.query,
                songCount: query.songLimit,
                songOffset: query.songStartIndex,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to search');
        }

        return {
            albumArtists: (res.body.searchResult3?.artist || [])?.map((artist) =>
                ssNormalize.albumArtist(artist, apiClientProps.server),
            ),
            albums: (res.body.searchResult3?.album || []).map((album) =>
                ssNormalize.album(album, apiClientProps.server),
            ),
            songs: (res.body.searchResult3?.song || []).map((song) =>
                ssNormalize.song(song, apiClientProps.server),
            ),
        };
    },
    setRating: async (args) => {
        const { apiClientProps, query } = args;

        const itemIds = query.id;

        for (const id of itemIds) {
            await ssApiClient(apiClientProps).setRating({
                query: {
                    id,
                    rating: query.rating,
                },
            });
        }

        return null;
    },
    updatePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        const res = await ssApiClient(apiClientProps).updatePlaylist({
            query: {
                comment: body.comment,
                name: body.name,
                playlistId: query.id,
                public: body.public,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to add to playlist');
        }

        return null;
    },
};
