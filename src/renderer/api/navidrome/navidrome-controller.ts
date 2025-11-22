import { ndApiClient } from '/@/renderer/api/navidrome/navidrome-api';
import { ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import { ndNormalize } from '/@/shared/api/navidrome/navidrome-normalize';
import { NDSongListSort } from '/@/shared/api/navidrome/navidrome-types';
import { ssNormalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { getFeatures, hasFeature, VersionInfo } from '/@/shared/api/utils';
import {
    albumArtistListSortMap,
    albumListSortMap,
    AuthenticationResponse,
    genreListSortMap,
    InternalControllerEndpoint,
    playlistListSortMap,
    PlaylistSongListArgs,
    PlaylistSongListResponse,
    ServerListItemWithCredential,
    Song,
    songListSortMap,
    sortOrderMap,
    userListSortMap,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const VERSION_INFO: VersionInfo = [
    ['0.56.0', { [ServerFeature.TRACK_ALBUM_ARTIST_SEARCH]: [1] }],
    ['0.55.0', { [ServerFeature.BFR]: [1], [ServerFeature.TAGS]: [1] }],
    ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
    ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
];

const NAVIDROME_ROLES: Array<string | { label: string; value: string }> = [
    { label: 'all artists', value: '' },
    'arranger',
    'artist',
    'composer',
    'conductor',
    'director',
    'djmixer',
    'engineer',
    'lyricist',
    'mixer',
    'performer',
    'producer',
    'remixer',
];

const EXCLUDED_TAGS = new Set<string>(['disctotal', 'genre', 'tracktotal']);

const excludeMissing = (server?: null | ServerListItemWithCredential) => {
    if (!server) {
        return undefined;
    }

    if (hasFeature(server, ServerFeature.BFR)) {
        return { missing: false };
    }

    return undefined;
};

const getLibraryId = (musicFolderId?: string | string[]): string[] | undefined => {
    if (!musicFolderId) {
        return undefined;
    }

    return Array.isArray(musicFolderId) ? musicFolderId : [musicFolderId];
};

const getArtistSongKey = (server: null | ServerListItemWithCredential) =>
    hasFeature(server, ServerFeature.TRACK_ALBUM_ARTIST_SEARCH) ? 'artists_id' : 'album_artist_id';

export const NavidromeController: InternalControllerEndpoint = {
    addToPlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        const res = await ndApiClient(apiClientProps).addToPlaylist({
            body: {
                ids: body.songId,
            },
            params: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to add to playlist');
        }

        return null;
    },
    authenticate: async (url, body): Promise<AuthenticationResponse> => {
        const cleanServerUrl = url.replace(/\/$/, '');

        const res = await ndApiClient({ server: null, url: cleanServerUrl }).authenticate({
            body: {
                password: body.password,
                username: body.username,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to authenticate');
        }

        return {
            credential: `u=${body.username}&s=${res.body.data.subsonicSalt}&t=${res.body.data.subsonicToken}`,
            ndCredential: res.body.data.token,
            userId: res.body.data.id,
            username: res.body.data.username,
        };
    },
    createFavorite: SubsonicController.createFavorite,
    createPlaylist: async (args) => {
        const { apiClientProps, body } = args;

        const res = await ndApiClient(apiClientProps).createPlaylist({
            body: {
                comment: body.comment,
                name: body.name,
                public: body.public,
                ...body._custom,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to create playlist');
        }

        return {
            id: res.body.data.id,
        };
    },
    deleteFavorite: SubsonicController.deleteFavorite,
    deletePlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).deletePlaylist({
            params: {
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

        const res = await ndApiClient(apiClientProps).getAlbumArtistDetail({
            params: {
                id: query.id,
            },
        });

        const artistInfoRes = await ssApiClient(apiClientProps).getArtistInfo({
            query: {
                count: 10,
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist detail');
        }

        if (!apiClientProps.serverId) {
            throw new Error('Server is required');
        }

        // Prefer images from getArtistInfo first (which should be proxied)
        // Prioritize large > medium > small
        return ndNormalize.albumArtist(
            {
                ...res.body.data,
                ...(artistInfoRes.status === 200 && {
                    largeImageUrl:
                        artistInfoRes.body.artistInfo.largeImageUrl ||
                        artistInfoRes.body.artistInfo.mediumImageUrl ||
                        artistInfoRes.body.artistInfo.smallImageUrl ||
                        res.body.data.largeImageUrl,
                    similarArtists: artistInfoRes.body.artistInfo.similarArtist,
                }),
            },
            apiClientProps.server,
        );
    },
    getAlbumArtistList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getAlbumArtistList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: albumArtistListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                library_id: getLibraryId(query.musicFolderId),
                name: query.searchTerm,
                ...query._custom,
                role: hasFeature(apiClientProps.server, ServerFeature.BFR) ? 'albumartist' : '',
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        return {
            items: res.body.data.map((albumArtist) =>
                // Navidrome native API will return only external URL small/medium/large
                // image URL. Set large image to undefined to force `albumArtist` to use
                // /rest/getCoverArt.view?id=ar-...
                ndNormalize.albumArtist(
                    {
                        ...albumArtist,
                        largeImageUrl: undefined,
                    },
                    apiClientProps.server,
                ),
            ),
            startIndex: query.startIndex,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getAlbumArtistListCount: async ({ apiClientProps, query }) =>
        NavidromeController.getAlbumArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getAlbumDetail: async (args) => {
        const { apiClientProps, query } = args;

        const albumRes = await ndApiClient(apiClientProps).getAlbumDetail({
            params: {
                id: query.id,
            },
        });

        const songsData = await ndApiClient(apiClientProps).getSongList({
            query: {
                _end: 0,
                _order: 'ASC',
                _sort: NDSongListSort.ALBUM,
                _start: 0,
                album_id: [query.id],
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (albumRes.status !== 200 || songsData.status !== 200) {
            throw new Error('Failed to get album detail');
        }

        return ndNormalize.album(
            { ...albumRes.body.data, songs: songsData.body.data },
            apiClientProps.server,
        );
    },
    getAlbumInfo: async (args) => {
        const { apiClientProps, query } = args;

        const albumInfo = await ssApiClient(apiClientProps).getAlbumInfo2({
            query: {
                id: query.id,
            },
        });

        if (albumInfo.status !== 200) {
            throw new Error('Failed to get album info');
        }

        const info = albumInfo.body.albumInfo;

        return {
            imageUrl: info.largeImageUrl || info.mediumImageUrl || info.smallImageUrl || null,
            notes: info.notes || null,
        };
    },
    getAlbumList: async (args) => {
        const { apiClientProps, query } = args;

        const genres = hasFeature(apiClientProps.server, ServerFeature.BFR)
            ? query.genres
            : query.genres?.[0];

        const res = await ndApiClient(apiClientProps).getAlbumList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: albumListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                artist_id: query.artistIds?.[0],
                compilation: query.compilation,
                genre_id: genres,
                library_id: getLibraryId(query.musicFolderId),
                name: query.searchTerm,
                ...query._custom,
                starred: query.favorite,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album list');
        }

        return {
            items: res.body.data.map((album) => ndNormalize.album(album, apiClientProps.server)),
            startIndex: query?.startIndex || 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getAlbumListCount: async ({ apiClientProps, query }) =>
        NavidromeController.getAlbumList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getArtistList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getAlbumArtistList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: albumArtistListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                library_id: getLibraryId(query.musicFolderId),
                name: query.searchTerm,
                ...query._custom,
                role: query.role || undefined,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get artist list');
        }

        return {
            items: res.body.data.map((albumArtist) =>
                // Navidrome native API will return only external URL small/medium/large
                // image URL. Set large image to undefined to force `albumArtist` to use
                // /rest/getCoverArt.view?id=ar-...
                ndNormalize.albumArtist(
                    {
                        ...albumArtist,
                        largeImageUrl: undefined,
                    },
                    apiClientProps.server,
                ),
            ),
            startIndex: query.startIndex,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getArtistListCount: async ({ apiClientProps, query }) =>
        NavidromeController.getArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getDownloadUrl: SubsonicController.getDownloadUrl,
    getGenreList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getGenreList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: genreListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                library_id: getLibraryId(query.musicFolderId),
                name: query.searchTerm,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get genre list');
        }

        return {
            items: res.body.data.map((genre) => ndNormalize.genre(genre, apiClientProps.server)),
            startIndex: query.startIndex || 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getLyrics: SubsonicController.getLyrics,
    getMusicFolderList: SubsonicController.getMusicFolderList,
    getPlaylistDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getPlaylistDetail({
            params: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist detail');
        }

        return ndNormalize.playlist(res.body.data, apiClientProps.server);
    },
    getPlaylistList: async (args) => {
        const { apiClientProps, query } = args;
        const customQuery = query._custom;

        // Smart playlists only became available in 0.48.0. Do not filter for previous versions
        if (
            customQuery &&
            customQuery.smart !== undefined &&
            !hasFeature(apiClientProps.server, ServerFeature.PLAYLISTS_SMART)
        ) {
            customQuery.smart = undefined;
        }

        const res = await ndApiClient(apiClientProps).getPlaylistList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: query.sortBy ? playlistListSortMap.navidrome[query.sortBy] : undefined,
                _start: query.startIndex,
                q: query.searchTerm,
                ...customQuery,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist list');
        }

        return {
            items: res.body.data.map((item) => ndNormalize.playlist(item, apiClientProps.server)),
            startIndex: query?.startIndex || 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getPlaylistListCount: async ({ apiClientProps, query }) =>
        NavidromeController.getPlaylistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getPlaylistSongList: async (args: PlaylistSongListArgs): Promise<PlaylistSongListResponse> => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps as any).getPlaylistSongList({
            params: {
                id: query.id,
            },
            query: {
                _end: -1,
                _order: 'ASC',
                _start: 0,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get playlist song list');
        }

        return {
            items: res.body.data.map((item) => ndNormalize.song(item, apiClientProps.server)),
            startIndex: 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getRandomSongList: SubsonicController.getRandomSongList,
    getRoles: async ({ apiClientProps }) =>
        hasFeature(apiClientProps.server, ServerFeature.BFR) ? NAVIDROME_ROLES : [],
    getServerInfo: async (args) => {
        const { apiClientProps } = args;

        // Navidrome will always populate serverVersion
        const ping = await ssApiClient(apiClientProps).ping();

        if (ping.status !== 200) {
            throw new Error('Failed to ping server');
        }

        if (ping.body.serverVersion?.includes('pr-2709')) {
            ping.body.serverVersion = '0.55.0';
        }

        const navidromeFeatures = getFeatures(VERSION_INFO, ping.body.serverVersion!);
        const subsonicArgs = await SubsonicController.getServerInfo(args);

        const features = {
            ...navidromeFeatures,
            ...subsonicArgs.features,
            publicPlaylist: [1],
            [ServerFeature.MUSIC_FOLDER_MULTISELECT]: [1],
        };

        return {
            features,
            id: apiClientProps.serverId,
            version: ping.body.serverVersion!,
        };
    },
    getSimilarSongs: async (args) => {
        const { apiClientProps, query } = args;

        // Prefer getSimilarSongs (which queries last.fm) where available
        // otherwise find other tracks by the same album artist
        const res = await ssApiClient({
            ...apiClientProps,
            silent: true,
        }).getSimilarSongs({
            query: {
                count: query.count,
                id: query.songId,
            },
        });

        if (res.status === 200 && res.body.similarSongs?.song) {
            const similar = res.body.similarSongs.song.reduce<Song[]>((acc, song) => {
                if (song.id !== query.songId) {
                    acc.push(ssNormalize.song(song, apiClientProps.server));
                }

                return acc;
            }, []);

            if (similar.length > 0) {
                return similar;
            }
        }

        const fallback = await ndApiClient(apiClientProps).getSongList({
            query: {
                _end: 50,
                _order: 'ASC',
                _sort: NDSongListSort.RANDOM,
                _start: 0,
                [getArtistSongKey(apiClientProps.server)]: query.albumArtistIds,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (fallback.status !== 200) {
            throw new Error('Failed to get similar songs');
        }

        return fallback.body.data.reduce<Song[]>((acc, song) => {
            if (song.id !== query.songId) {
                acc.push(ndNormalize.song(song, apiClientProps.server));
            }

            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getSongDetail({
            params: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return ndNormalize.song(res.body.data, apiClientProps.server);
    },
    getSongList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getSongList({
            query: {
                _end: query.startIndex + (query.limit || -1),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: songListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                album_id: query.albumIds,
                genre_id: query.genreIds,
                [getArtistSongKey(apiClientProps.server)]: query.artistIds ?? query.albumArtistIds,
                library_id: getLibraryId(query.musicFolderId),
                starred: query.favorite,
                title: query.searchTerm,
                ...query._custom,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song list');
        }

        return {
            items: res.body.data.map((song) =>
                ndNormalize.song(song, apiClientProps.server, query.imageSize),
            ),
            startIndex: query?.startIndex || 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    getSongListCount: async ({ apiClientProps, query }) =>
        NavidromeController.getSongList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getStreamUrl: SubsonicController.getStreamUrl,
    getStructuredLyrics: SubsonicController.getStructuredLyrics,
    getTags: async (args) => {
        const { apiClientProps } = args;

        if (!hasFeature(apiClientProps.server, ServerFeature.TAGS)) {
            return { boolTags: undefined, enumTags: undefined };
        }

        const res = await ndApiClient(apiClientProps).getTags();

        if (res.status !== 200) {
            throw new Error('failed to get tags');
        }

        const tagsToValues = new Map<string, string[]>();

        for (const tag of res.body.data) {
            if (!EXCLUDED_TAGS.has(tag.tagName)) {
                if (tagsToValues.has(tag.tagName)) {
                    tagsToValues.get(tag.tagName)!.push(tag.tagValue);
                } else {
                    tagsToValues.set(tag.tagName, [tag.tagValue]);
                }
            }
        }

        return {
            boolTags: undefined,
            enumTags: Array.from(tagsToValues)
                .map((data) => ({
                    name: data[0],
                    options: data[1].sort((a, b) =>
                        a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()),
                    ),
                }))
                .sort((a, b) =>
                    a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
                ),
        };
    },
    getTopSongs: SubsonicController.getTopSongs,
    getUserList: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).getUserList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: userListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                ...query._custom,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get user list');
        }

        return {
            items: res.body.data.map((user) => ndNormalize.user(user)),
            startIndex: query?.startIndex || 0,
            totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
        };
    },
    movePlaylistItem: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).movePlaylistItem({
            body: {
                insert_before: (query.endingIndex + 1).toString(),
            },
            params: {
                playlistId: query.playlistId,
                trackNumber: query.startingIndex.toString(),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to move item in playlist');
        }
    },
    removeFromPlaylist: async (args) => {
        const { apiClientProps, query } = args;

        const res = await ndApiClient(apiClientProps).removeFromPlaylist({
            params: {
                id: query.id,
            },
            query: {
                id: query.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to remove from playlist');
        }

        return null;
    },
    scrobble: SubsonicController.scrobble,
    search: SubsonicController.search,
    setRating: SubsonicController.setRating,
    shareItem: async (args) => {
        const { apiClientProps, body } = args;

        const res = await ndApiClient(apiClientProps).shareItem({
            body: {
                description: body.description,
                downloadable: body.downloadable,
                expires: body.expires,
                resourceIds: body.resourceIds,
                resourceType: body.resourceType,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to share item');
        }

        return {
            id: res.body.data.id,
        };
    },
    updatePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        const res = await ndApiClient(apiClientProps).updatePlaylist({
            body: {
                comment: body.comment || '',
                name: body.name,
                public: body?.public || false,
                ...body._custom,
            },
            params: {
                id: query.id,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to update playlist');
        }

        return null;
    },
};
