import { set } from 'idb-keyval';

import { ndApiClient } from '/@/renderer/api/navidrome/navidrome-api';
import { ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import { ndNormalize } from '/@/shared/api/navidrome/navidrome-normalize';
import { NDSongListSort } from '/@/shared/api/navidrome/navidrome-types';
import { ssNormalize } from '/@/shared/api/subsonic/subsonic-normalize';
import { getFeatures, hasFeature, hasFeatureWithVersion, VersionInfo } from '/@/shared/api/utils';
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
    songListSortMap,
    sortOrderMap,
    tagListSortMap,
    userListSortMap,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const VERSION_INFO: VersionInfo = [
    // Why 2? Subsonic controller will return 1 for its own implementation
    // Use 2 to denote that Navidrome's own API has a different endpoint
    ['0.57.0', { [ServerFeature.SERVER_PLAY_QUEUE]: [2] }],
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

// Tags that are irrelevant or non-functional as filters
const EXCLUDED_TAGS = new Set<string>([
    'genre', // Duplicate of genre filter
]);

const EXCLUDED_ALBUM_TAGS = new Set<string>([
    'asin',
    'barcode',
    'copyright',
    'disctotal',
    'encodedby',
    'isrc',
    'key',
    'language',
    'musicbrainz_workid',
    'script',
    'tracktotal',
    'website',
    'work',
]);

const EXCLUDED_SONG_TAGS = new Set<string>([]);

// Tags that use IDs as values as opposed to the tag value
const ID_TAGS = new Set<string>(['albumversion', 'mood']);

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
            isAdmin: Boolean(res.body.data.isAdmin),
            ndCredential: res.body.data.token,
            userId: res.body.data.id,
            username: res.body.data.username,
        };
    },
    createFavorite: SubsonicController.createFavorite,
    createInternetRadioStation: SubsonicController.createInternetRadioStation,
    createPlaylist: async (args) => {
        const { apiClientProps, body } = args;

        const res = await ndApiClient(apiClientProps).createPlaylist({
            body: {
                comment: body.comment,
                name: body.name,
                ownerId: body.ownerId,
                public: body.public,
                rules: body.queryBuilderRules,
                sync: body.sync,
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
    deleteInternetRadioStation: SubsonicController.deleteInternetRadioStation,
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
                starred: query.favorite,
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
            ? query.genreIds
            : query.genreIds?.[0];

        const res = await ndApiClient(apiClientProps).getAlbumList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: albumListSortMap.navidrome[query.sortBy],
                _start: query.startIndex,
                artist_id: query.artistIds?.[0],
                compilation: query.compilation,
                genre_id: genres,
                has_rating: query.hasRating,
                library_id: getLibraryId(query.musicFolderId),
                name: query.searchTerm,
                recently_played: query.isRecentlyPlayed,
                starred: query.favorite,
                year: query.maxYear || query.minYear,
                ...query._custom,
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
                role: query.role || undefined,
                starred: query.favorite,
                ...query._custom,
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
    getFolder: SubsonicController.getFolder,
    getGenreList: async (args) => {
        const { apiClientProps, query } = args;

        if (hasFeature(apiClientProps.server, ServerFeature.BFR)) {
            const res = await ndApiClient(apiClientProps).getTagList({
                query: {
                    _end: query.startIndex + (query.limit || 0),
                    _order: sortOrderMap.navidrome[query.sortOrder],
                    _sort: tagListSortMap.navidrome[query.sortBy],
                    _start: query.startIndex,
                    library_id: getLibraryId(query.musicFolderId),
                    tag_name: 'genre',
                    tag_value: query.searchTerm,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to get genre list');
            }

            return {
                items: res.body.data.map((genre) =>
                    ndNormalize.genre(
                        {
                            albumCount: genre.albumCount,
                            id: genre.id,
                            name: genre.tagValue,
                            songCount: genre.songCount,
                        },
                        apiClientProps.server,
                    ),
                ),
                startIndex: query.startIndex || 0,
                totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
            };
        }

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
    getImageUrl: SubsonicController.getImageUrl,
    getInternetRadioStations: SubsonicController.getInternetRadioStations,
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

        const res = await ndApiClient(apiClientProps).getPlaylistList({
            query: {
                _end: query.startIndex + (query.limit || 0),
                _order: sortOrderMap.navidrome[query.sortOrder],
                _sort: query.sortBy ? playlistListSortMap.navidrome[query.sortBy] : undefined,
                _start: query.startIndex,
                q: query.searchTerm,
                smart: query.excludeSmartPlaylists ? false : undefined,
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
    getPlayQueue: async (args) => {
        const { apiClientProps } = args;

        if (hasFeatureWithVersion(apiClientProps.server, ServerFeature.SERVER_PLAY_QUEUE, 2)) {
            const res = await ndApiClient(apiClientProps).getQueue();

            if (res.status !== 200) {
                throw new Error('Failed to get play queue');
            }

            const { changedBy, current, items, position, updatedAt } = res.body.data;

            const entries = items.map((song) => ndNormalize.song(song, apiClientProps.server));

            return {
                changed: updatedAt,
                changedBy,
                currentIndex: current !== undefined ? current : 0,
                entry: entries,
                positionMs: position,
                username: apiClientProps.server?.username ?? '',
            };
        }

        return SubsonicController.getPlayQueue(args);
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
            ...subsonicArgs.features,
            ...navidromeFeatures,
            publicPlaylist: [1],
            [ServerFeature.MUSIC_FOLDER_MULTISELECT]: [1],
        };

        if (subsonicArgs.features.serverPlayQueue && navidromeFeatures.serverPlayQueue) {
            features.serverPlayQueue = navidromeFeatures.serverPlayQueue.concat(
                subsonicArgs.features.serverPlayQueue,
            );
        }

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

        if (res.status !== 200) {
            throw new Error('Failed to get similar songs');
        }

        return (
            (res.body.similarSongs?.song || [])
                .filter((song) => song.id !== query.songId)
                .map((song) => ssNormalize.song(song, apiClientProps.server)) || []
        );
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
                year: query.maxYear || query.minYear,
                ...query._custom,
                ...excludeMissing(apiClientProps.server),
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song list');
        }

        return {
            items: res.body.data.map((song) => ndNormalize.song(song, apiClientProps.server)),
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
    getTagList: async (args) => {
        const { apiClientProps } = args;

        if (!hasFeature(apiClientProps.server, ServerFeature.TAGS)) {
            return { boolTags: undefined, enumTags: undefined, excluded: { album: [], song: [] } };
        }

        const res = await ndApiClient(apiClientProps).getTagList({
            query: {},
        });

        if (res.status !== 200) {
            throw new Error('failed to get tags');
        }

        const tagsToValues = new Map<string, { id: string; name: string }[]>();

        for (const tag of res.body.data) {
            if (!EXCLUDED_TAGS.has(tag.tagName)) {
                if (tagsToValues.has(tag.tagName)) {
                    tagsToValues.get(tag.tagName)!.push({
                        id: ID_TAGS.has(tag.tagName) ? tag.id : tag.tagValue,
                        name: tag.tagValue,
                    });
                } else {
                    tagsToValues.set(tag.tagName, [
                        {
                            id: ID_TAGS.has(tag.tagName) ? tag.id : tag.tagValue,
                            name: tag.tagValue,
                        },
                    ]);
                }
            }
        }

        const enumTags = Array.from(tagsToValues)
            .map((data) => ({
                name: data[0],
                options: data[1]
                    .sort((a, b) =>
                        a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
                    )
                    .map((option) => ({ id: option.id, name: option.name })),
            }))
            .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

        const excludedAlbumTags = Array.from(EXCLUDED_ALBUM_TAGS.values());
        const excludedSongTags = Array.from(EXCLUDED_SONG_TAGS.values());

        return {
            boolTags: undefined,
            enumTags,
            excluded: {
                album: excludedAlbumTags,
                song: excludedSongTags,
            },
        };
    },
    getTopSongs: SubsonicController.getTopSongs,
    getUserInfo: SubsonicController.getUserInfo,
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
    replacePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        // 1. Fetch existing songs from the playlist without any sorts
        const existingSongsRes = await ndApiClient(apiClientProps as any).getPlaylistSongList({
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

        if (existingSongsRes.status !== 200) {
            throw new Error('Failed to fetch existing playlist songs');
        }

        const existingSongs = existingSongsRes.body.data.map((item) =>
            ndNormalize.song(item, apiClientProps.server),
        );

        // 2. Get playlist detail to get the name
        const playlistDetailRes = await ndApiClient(apiClientProps).getPlaylistDetail({
            params: {
                id: query.id,
            },
        });

        if (playlistDetailRes.status !== 200) {
            throw new Error('Failed to get playlist detail');
        }

        const playlist = ndNormalize.playlist(playlistDetailRes.body.data, apiClientProps.server);

        // 3. Make a backup of the playlist ids and their order, along with the id of the playlist and name
        const backup = {
            id: query.id,
            name: playlist.name,
            songIds: existingSongs.map((song) => song.id),
            timestamp: Date.now(),
        };

        // Store backup in IndexedDB using idb-keyval
        const backupKey = `playlist-backup-${query.id}`;
        await set(backupKey, backup);

        // 4. Remove all songs from the playlist
        if (existingSongs.length > 0) {
            const existingPlaylistItemIds = existingSongs
                .map((song) => song.playlistItemId)
                .filter((id): id is string => id !== undefined && id !== null);

            if (existingPlaylistItemIds.length > 0) {
                const removeRes = await ndApiClient(apiClientProps).removeFromPlaylist({
                    params: {
                        id: query.id,
                    },
                    query: {
                        id: existingPlaylistItemIds,
                    },
                });

                if (removeRes.status !== 200) {
                    throw new Error('Failed to remove songs from playlist');
                }
            }
        }

        // 5. Add the new song ids to the playlist
        if (body.songId.length > 0) {
            const addRes = await ndApiClient(apiClientProps).addToPlaylist({
                body: {
                    ids: body.songId,
                },
                params: {
                    id: query.id,
                },
            });

            if (addRes.status !== 200) {
                throw new Error('Failed to add songs to playlist');
            }
        }

        return null;
    },
    savePlayQueue: async (args) => {
        const { apiClientProps, query } = args;

        // Prefer using Navidrome's API only in the situation where the OpenSubsonic extension is not present
        // OpenSubsonic extension is preferable as the credentials never expire
        if (
            hasFeatureWithVersion(apiClientProps.server, ServerFeature.SERVER_PLAY_QUEUE, 2) &&
            !hasFeatureWithVersion(apiClientProps.server, ServerFeature.SERVER_PLAY_QUEUE, 1)
        ) {
            const res = await ndApiClient(apiClientProps).saveQueue({
                body: {
                    current: query.currentIndex !== undefined ? query.currentIndex : undefined,
                    ids: query.songs,
                    position: query.positionMs,
                },
            });

            if (res.status !== 200) {
                throw new Error('Failed to save play queue');
            }
            return;
        }

        return SubsonicController.savePlayQueue(args);
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
    updateInternetRadioStation: SubsonicController.updateInternetRadioStation,
    updatePlaylist: async (args) => {
        const { apiClientProps, body, query } = args;

        const res = await ndApiClient(apiClientProps).updatePlaylist({
            body: {
                comment: body.comment || '',
                name: body.name,
                ownerId: body.ownerId,
                public: body?.public || false,
                rules: body.queryBuilderRules,
                sync: body.sync,
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
