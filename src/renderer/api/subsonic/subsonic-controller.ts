import md5 from 'md5';
import { subsonicApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { subsonicNormalize } from '/@/renderer/api/subsonic/subsonic-normalize';
import { AlbumListSortType, SubsonicApi } from '/@/renderer/api/subsonic/subsonic-types';
import {
    AlbumListSort,
    AuthenticationResponse,
    ControllerEndpoint,
    LibraryItem,
} from '/@/renderer/api/types';
import { randomString } from '/@/renderer/utils';
import { fsLog } from '/@/logger';

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
            ...subsonicNormalize.albumArtist(artist, apiClientProps.server),
            albums: artist.album.map((album) =>
                subsonicNormalize.album(album, apiClientProps.server),
            ),
            artistInfo,
        };
    },
    getAlbumArtistList: async (args) => {
        const { query, apiClientProps } = args;

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

        return {
            items: artists.map((artist) =>
                subsonicNormalize.albumArtist(artist, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount: null,
        };
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
        const { apiClientProps } = args;

        const res = await subsonicApiClient(apiClientProps).getGenres({});

        if (res.status !== 200) {
            fsLog.error('Failed to get genre list');
            throw new Error('Failed to get genre list');
        }

        const genres = res.body['subsonic-response'].genres.genre.map(subsonicNormalize.genre);

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
