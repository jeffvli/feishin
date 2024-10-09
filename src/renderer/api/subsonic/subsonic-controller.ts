import dayjs from 'dayjs';
import filter from 'lodash/filter';
import orderBy from 'lodash/orderBy';
import md5 from 'md5';
import { ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { ssNormalize } from '/@/renderer/api/subsonic/subsonic-normalize';
import { AlbumListSortType, SubsonicExtensions } from '/@/renderer/api/subsonic/subsonic-types';
import {
    LibraryItem,
    Song,
    ControllerEndpoint,
    sortSongList,
    sortAlbumArtistList,
    PlaylistListSort,
    GenreListSort,
    AlbumListSort,
    sortAlbumList,
    SortOrder,
} from '/@/renderer/api/types';
import { randomString } from '/@/renderer/utils';
import { ServerFeatures } from '/@/renderer/api/features-types';

const ALBUM_LIST_SORT_MAPPING: Record<AlbumListSort, AlbumListSortType | undefined> = {
    [AlbumListSort.RANDOM]: AlbumListSortType.RANDOM,
    [AlbumListSort.ALBUM_ARTIST]: AlbumListSortType.ALPHABETICAL_BY_ARTIST,
    [AlbumListSort.PLAY_COUNT]: AlbumListSortType.FREQUENT,
    [AlbumListSort.RECENTLY_ADDED]: AlbumListSortType.NEWEST,
    [AlbumListSort.FAVORITED]: AlbumListSortType.STARRED,
    [AlbumListSort.YEAR]: AlbumListSortType.BY_YEAR,
    [AlbumListSort.NAME]: AlbumListSortType.ALPHABETICAL_BY_NAME,
    [AlbumListSort.COMMUNITY_RATING]: undefined,
    [AlbumListSort.DURATION]: undefined,
    [AlbumListSort.CRITIC_RATING]: undefined,
    [AlbumListSort.RATING]: undefined,
    [AlbumListSort.ARTIST]: undefined,
    [AlbumListSort.RECENTLY_PLAYED]: AlbumListSortType.RECENT,
    [AlbumListSort.RELEASE_DATE]: undefined,
    [AlbumListSort.SONG_COUNT]: undefined,
};

export const SubsonicController: ControllerEndpoint = {
    addToPlaylist: async ({ body, query, apiClientProps }) => {
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

        await ssApiClient({ server: null, url: cleanServerUrl }).authenticate({
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
    },
    createFavorite: async (args) => {
        const { query, apiClientProps } = args;

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
    createPlaylist: async ({ body, apiClientProps }) => {
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
        const { query, apiClientProps } = args;

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
        const { query, apiClientProps } = args;

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
        const { query, apiClientProps } = args;

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
            albums: artist.album.map((album) => ssNormalize.album(album, apiClientProps.server)),
            similarArtists:
                artistInfo?.similarArtist?.map((artist) =>
                    ssNormalize.albumArtist(artist, apiClientProps.server, 300),
                ) || null,
        };
    },
    getAlbumArtistList: async (args) => {
        const { query, apiClientProps } = args;

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
        SubsonicController.getAlbumArtistList(args).then((res) => res!.totalRecordCount!),
    getAlbumDetail: async (args) => {
        const { query, apiClientProps } = args;

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
        const { query, apiClientProps } = args;

        if (query.searchTerm) {
            const res = await ssApiClient(apiClientProps).search3({
                query: {
                    albumCount: query.limit,
                    albumOffset: query.startIndex,
                    artistCount: 0,
                    artistOffset: 0,
                    query: query.searchTerm || '""',
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
            const promises = [];

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

                return artist.body.artist.album;
            });

            return {
                items: albums.map((album) => ssNormalize.album(album, apiClientProps.server)),
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

        let fromYear;
        let toYear;

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
        const { query, apiClientProps } = args;

        if (query.searchTerm) {
            let fetchNextPage = true;
            let startIndex = 0;
            let totalRecordCount = 0;

            while (fetchNextPage) {
                const res = await ssApiClient(apiClientProps).search3({
                    query: {
                        albumCount: 500,
                        albumOffset: startIndex,
                        artistCount: 0,
                        artistOffset: 0,
                        query: query.searchTerm || '""',
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

                // The max limit size for Subsonic is 500
                fetchNextPage = albumCount === 500;
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

        let fromYear;
        let toYear;

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
                    size: 500,
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

            // The max limit size for Subsonic is 500
            fetchNextPage = albumCount === 500;
        }

        return totalRecordCount;
    },
    getDownloadUrl: (args) => {
        const { apiClientProps, query } = args;

        return (
            `${apiClientProps.server?.url}/rest/download.view` +
            `?id=${query.id}` +
            `&${apiClientProps.server?.credential}` +
            '&v=1.13.0' +
            '&c=feishin'
        );
    },
    getGenreList: async ({ query, apiClientProps }) => {
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

        const genres = results.map(ssNormalize.genre);

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
        const { query, apiClientProps } = args;

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
    getPlaylistList: async ({ query, apiClientProps }) => {
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
    getPlaylistListCount: async ({ query, apiClientProps }) => {
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
    getPlaylistSongList: async ({ query, apiClientProps }) => {
        const res = await ssApiClient(apiClientProps).getPlaylist({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist song list');
        }

        let results =
            res.body.playlist.entry?.map((song) =>
                ssNormalize.song(song, apiClientProps.server, ''),
            ) || [];

        if (query.sortBy && query.sortOrder) {
            results = sortSongList(results, query.sortBy, query.sortOrder);
        }

        return {
            items: results,
            startIndex: 0,
            totalRecordCount: results?.length || 0,
        };
    },
    getRandomSongList: async (args) => {
        const { query, apiClientProps } = args;

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
            items: results.map((song) => ssNormalize.song(song, apiClientProps.server, '')),
            startIndex: 0,
            totalRecordCount: res.body.randomSongs?.song?.length || 0,
        };
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
            features.lyricsMultipleStructured = true;
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
                acc.push(ssNormalize.song(song, apiClientProps.server, ''));
            }

            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { query, apiClientProps } = args;

        const res = await ssApiClient(apiClientProps).getSong({
            query: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return ssNormalize.song(res.body.song, apiClientProps.server, '');
    },
    getSongList: async ({ query, apiClientProps }) => {
        const fromAlbumPromises = [];
        const artistDetailPromises = [];
        let results: any[] = [];

        if (query.searchTerm) {
            const res = await ssApiClient(apiClientProps).search3({
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
                throw new Error('Failed to get song list');
            }

            return {
                items:
                    res.body.searchResult3?.song?.map((song) =>
                        ssNormalize.song(song, apiClientProps.server, ''),
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
                items:
                    results.map((song) => ssNormalize.song(song, apiClientProps.server, '')) || [],
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
                    ssNormalize.song(song, apiClientProps.server, ''),
                ) || [];

            return {
                items: sortSongList(results, query.sortBy, query.sortOrder),
                startIndex: 0,
                totalRecordCount: (res.body.starred?.song || []).length || 0,
            };
        }

        if (query.albumIds || query.artistIds) {
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

            if (query.artistIds) {
                for (const artistId of query.artistIds) {
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

                    return artist.body.artist.album;
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
                items: results.map((song) => ssNormalize.song(song, apiClientProps.server, '')),
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
                query: query.searchTerm || '""',
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
                    ssNormalize.song(song, apiClientProps.server, ''),
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
                        query: query.searchTerm || '""',
                        songCount: 500,
                        songOffset: startIndex,
                    },
                });

                if (res.status !== 200) {
                    throw new Error('Failed to get song list count');
                }

                const songCount = (res.body.searchResult3?.song || []).length || 0;

                totalRecordCount += songCount;
                startIndex += songCount;

                // The max limit size for Subsonic is 500
                fetchNextPage = songCount === 500;
            }

            return totalRecordCount;
        }

        if (query.genreIds) {
            let totalRecordCount = 0;
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
                    startIndex = sectionIndex === 0 ? 0 : sectionIndex - 5000;
                    break;
                } else {
                    sectionIndex += 5000;
                }
            }

            while (fetchNextPage) {
                const res = await ssApiClient(apiClientProps).getSongsByGenre({
                    query: {
                        count: 500,
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

                fetchNextPage = numberOfResults === 500;
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

        while (fetchNextSection) {
            const res = await ssApiClient(apiClientProps).search3({
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
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = (res.body.searchResult3?.song || []).length || 0;

            // Check each batch of 5000 songs to check for data
            sectionIndex += 5000;
            fetchNextSection = numberOfResults === 1;

            if (!fetchNextSection) {
                // fetchNextBlock will be false on the next loop so we need to subtract 5000 * 2
                startIndex = sectionIndex - 10000;
            }
        }

        while (fetchNextPage) {
            const res = await ssApiClient(apiClientProps).search3({
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
                throw new Error('Failed to get song list count');
            }

            const numberOfResults = (res.body.searchResult3?.song || []).length || 0;

            totalRecordCount = startIndex + numberOfResults;
            startIndex += numberOfResults;

            // The max limit size for Subsonic is 500
            fetchNextPage = numberOfResults === 500;
        }

        return totalRecordCount;
    },
    getStructuredLyrics: async (args) => {
        const { query, apiClientProps } = args;

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
        const { query, apiClientProps } = args;

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
                    ssNormalize.song(song, apiClientProps.server, ''),
                ) || [],
            startIndex: 0,
            totalRecordCount: res.body.topSongs?.song?.length || 0,
        };
    },
    getTranscodingUrl: (args) => {
        const { base, format, bitrate } = args.query;
        let url = base;
        if (format) {
            url += `&format=${format}`;
        }
        if (bitrate !== undefined) {
            url += `&maxBitRate=${bitrate}`;
        }

        return url;
    },
    removeFromPlaylist: async ({ query, apiClientProps }) => {
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
        const { query, apiClientProps } = args;

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
        const { query, apiClientProps } = args;

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
                ssNormalize.song(song, apiClientProps.server, ''),
            ),
        };
    },
    setRating: async (args) => {
        const { query, apiClientProps } = args;

        const itemIds = query.item.map((item) => item.id);

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
        const { body, query, apiClientProps } = args;

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

// export const getAlbumArtistDetail = async (
//   args: AlbumArtistDetailArgs,
// ): Promise<SSAlbumArtistDetail> => {
//   const { server, signal, query } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams: SSAlbumArtistDetailParams = {
//     id: query.id,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('/getArtist.view', {
//       prefixUrl: server?.url,
//       searchParams,
//       signal,
//     })
//     .json<SSAlbumArtistDetailResponse>();

//   return data.artist;
// };

// const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<SSAlbumArtistList> => {
//   const { signal, server, query } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams: SSAlbumArtistListParams = {
//     musicFolderId: query.musicFolderId,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('rest/getArtists.view', {
//       prefixUrl: server?.url,
//       searchParams,
//       signal,
//     })
//     .json<SSAlbumArtistListResponse>();

//   const artists = (data.artists?.index || []).flatMap((index: SSArtistIndex) => index.artist);

//   return {
//     items: artists,
//     startIndex: query.startIndex,
//     totalRecordCount: null,
//   };
// };

// const getGenreList = async (args: GenreListArgs): Promise<SSGenreList> => {
//   const { server, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const data = await api
//     .get('rest/getGenres.view', {
//       prefixUrl: server?.url,
//       searchParams: defaultParams,
//       signal,
//     })
//     .json<SSGenreListResponse>();

//   return data.genres.genre;
// };

// const getAlbumDetail = async (args: AlbumDetailArgs): Promise<SSAlbumDetail> => {
//   const { server, query, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams = {
//     id: query.id,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('rest/getAlbum.view', {
//       prefixUrl: server?.url,
//       searchParams: parseSearchParams(searchParams),
//       signal,
//     })
//     .json<SSAlbumDetailResponse>();

//   const { song: songs, ...dataWithoutSong } = data.album;
//   return { ...dataWithoutSong, songs };
// };

// const getAlbumList = async (args: AlbumListArgs): Promise<SSAlbumList> => {
//   const { server, query, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams = {
//     ...defaultParams,
//   };
//   const data = await api
//     .get('rest/getAlbumList2.view', {
//       prefixUrl: server?.url,
//       searchParams: parseSearchParams(searchParams),
//       signal,
//     })
//     .json<SSAlbumListResponse>();

//   return {
//     items: data.albumList2.album,
//     startIndex: query.startIndex,
//     totalRecordCount: null,
//   };
// };
