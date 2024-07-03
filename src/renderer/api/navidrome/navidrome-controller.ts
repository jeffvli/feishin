import { ndApiClient } from '/@/renderer/api/navidrome/navidrome-api';
import { ndNormalize } from '/@/renderer/api/navidrome/navidrome-normalize';
import { ndType } from '/@/renderer/api/navidrome/navidrome-types';
import { ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import {
    AlbumArtistDetailArgs,
    AlbumArtistDetailResponse,
    AddToPlaylistArgs,
    AddToPlaylistResponse,
    CreatePlaylistResponse,
    CreatePlaylistArgs,
    DeletePlaylistArgs,
    DeletePlaylistResponse,
    AlbumArtistListResponse,
    AlbumArtistListArgs,
    albumArtistListSortMap,
    sortOrderMap,
    AuthenticationResponse,
    UserListResponse,
    UserListArgs,
    userListSortMap,
    GenreListArgs,
    GenreListResponse,
    AlbumDetailResponse,
    AlbumDetailArgs,
    AlbumListArgs,
    albumListSortMap,
    AlbumListResponse,
    SongListResponse,
    SongListArgs,
    songListSortMap,
    SongDetailResponse,
    SongDetailArgs,
    UpdatePlaylistArgs,
    UpdatePlaylistResponse,
    PlaylistListResponse,
    PlaylistDetailArgs,
    PlaylistListArgs,
    playlistListSortMap,
    PlaylistDetailResponse,
    PlaylistSongListArgs,
    PlaylistSongListResponse,
    RemoveFromPlaylistResponse,
    RemoveFromPlaylistArgs,
    genreListSortMap,
    ServerInfo,
    ServerInfoArgs,
    ShareItemArgs,
    ShareItemResponse,
    SimilarSongsArgs,
    Song,
} from '../types';
import { VersionInfo, getFeatures, hasFeature } from '/@/renderer/api/utils';
import { ServerFeature, ServerFeatures } from '/@/renderer/api/features-types';
import { SubsonicExtensions } from '/@/renderer/api/subsonic/subsonic-types';
import { NDSongListSort } from '/@/renderer/api/navidrome.types';
import { ssNormalize } from '/@/renderer/api/subsonic/subsonic-normalize';

const authenticate = async (
    url: string,
    body: { password: string; username: string },
): Promise<AuthenticationResponse> => {
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
};

const getUserList = async (args: UserListArgs): Promise<UserListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getUserList({
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: userListSortMap.navidrome[query.sortBy],
            _start: query.startIndex,
            ...query._custom?.navidrome,
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
};

const getGenreList = async (args: GenreListArgs): Promise<GenreListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getGenreList({
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: genreListSortMap.navidrome[query.sortBy],
            _start: query.startIndex,
            name: query.searchTerm,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get genre list');
    }

    return {
        items: res.body.data.map((genre) => ndNormalize.genre(genre)),
        startIndex: query.startIndex || 0,
        totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
    };
};

const getAlbumArtistDetail = async (
    args: AlbumArtistDetailArgs,
): Promise<AlbumArtistDetailResponse> => {
    const { query, apiClientProps } = args;

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

    if (!apiClientProps.server) {
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
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<AlbumArtistListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getAlbumArtistList({
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: albumArtistListSortMap.navidrome[query.sortBy],
            _start: query.startIndex,
            name: query.searchTerm,
            ...query._custom?.navidrome,
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
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<AlbumDetailResponse> => {
    const { query, apiClientProps } = args;

    const albumRes = await ndApiClient(apiClientProps).getAlbumDetail({
        params: {
            id: query.id,
        },
    });

    const songsData = await ndApiClient(apiClientProps).getSongList({
        query: {
            _end: 0,
            _order: 'ASC',
            _sort: 'album',
            _start: 0,
            album_id: [query.id],
        },
    });

    if (albumRes.status !== 200 || songsData.status !== 200) {
        throw new Error('Failed to get album detail');
    }

    return ndNormalize.album(
        { ...albumRes.body.data, songs: songsData.body.data },
        apiClientProps.server,
    );
};

const getAlbumList = async (args: AlbumListArgs): Promise<AlbumListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getAlbumList({
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: albumListSortMap.navidrome[query.sortBy],
            _start: query.startIndex,
            artist_id: query.artistIds?.[0],
            name: query.searchTerm,
            ...query._custom?.navidrome,
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
};

const getSongList = async (args: SongListArgs): Promise<SongListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getSongList({
        query: {
            _end: query.startIndex + (query.limit || -1),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: songListSortMap.navidrome[query.sortBy],
            _start: query.startIndex,
            album_artist_id: query.artistIds,
            album_id: query.albumIds,
            title: query.searchTerm,
            ...query._custom?.navidrome,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get song list');
    }

    return {
        items: res.body.data.map((song) =>
            ndNormalize.song(song, apiClientProps.server, '', query.imageSize),
        ),
        startIndex: query?.startIndex || 0,
        totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
    };
};

const getSongDetail = async (args: SongDetailArgs): Promise<SongDetailResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getSongDetail({
        params: {
            id: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get song detail');
    }

    return ndNormalize.song(res.body.data, apiClientProps.server, '');
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
    const { body, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).createPlaylist({
        body: {
            comment: body.comment,
            name: body.name,
            public: body._custom?.navidrome?.public,
            rules: body._custom?.navidrome?.rules,
            sync: body._custom?.navidrome?.sync,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to create playlist');
    }

    return {
        id: res.body.data.id,
    };
};

const updatePlaylist = async (args: UpdatePlaylistArgs): Promise<UpdatePlaylistResponse> => {
    const { query, body, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).updatePlaylist({
        body: {
            comment: body.comment || '',
            name: body.name,
            public: body._custom?.navidrome?.public || false,
            rules: body._custom?.navidrome?.rules ? body._custom.navidrome.rules : undefined,
            sync: body._custom?.navidrome?.sync || undefined,
        },
        params: {
            id: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to update playlist');
    }

    return null;
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<DeletePlaylistResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).deletePlaylist({
        body: null,
        params: {
            id: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to delete playlist');
    }

    return null;
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<PlaylistListResponse> => {
    const { query, apiClientProps } = args;
    const customQuery = query._custom?.navidrome;

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
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<PlaylistDetailResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getPlaylistDetail({
        params: {
            id: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist detail');
    }

    return ndNormalize.playlist(res.body.data, apiClientProps.server);
};

const getPlaylistSongList = async (
    args: PlaylistSongListArgs,
): Promise<PlaylistSongListResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getPlaylistSongList({
        params: {
            id: query.id,
        },
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : 'ASC',
            _sort: query.sortBy
                ? songListSortMap.navidrome[query.sortBy]
                : ndType._enum.songList.ID,
            _start: query.startIndex,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist song list');
    }

    return {
        items: res.body.data.map((item) => ndNormalize.song(item, apiClientProps.server, '')),
        startIndex: query?.startIndex || 0,
        totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
    };
};

const addToPlaylist = async (args: AddToPlaylistArgs): Promise<AddToPlaylistResponse> => {
    const { body, query, apiClientProps } = args;

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
};

const removeFromPlaylist = async (
    args: RemoveFromPlaylistArgs,
): Promise<RemoveFromPlaylistResponse> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).removeFromPlaylist({
        body: null,
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
};

const VERSION_INFO: VersionInfo = [
    ['0.49.3', { [ServerFeature.SHARING_ALBUM_SONG]: [1] }],
    ['0.48.0', { [ServerFeature.PLAYLISTS_SMART]: [1] }],
];

const getServerInfo = async (args: ServerInfoArgs): Promise<ServerInfo> => {
    const { apiClientProps } = args;

    // Navidrome will always populate serverVersion
    const ping = await ssApiClient(apiClientProps).ping();

    if (ping.status !== 200) {
        throw new Error('Failed to ping server');
    }

    const navidromeFeatures: Record<string, number[]> = getFeatures(
        VERSION_INFO,
        ping.body.serverVersion!,
    );

    if (ping.body.openSubsonic) {
        const res = await ssApiClient(apiClientProps).getServerInfo();

        if (res.status !== 200) {
            throw new Error('Failed to get server extensions');
        }

        // The type here isn't necessarily an array (even though it's supposed to be). This is
        // an implementation detail of Navidrome 0.50. Do a type check to make sure it's actually
        // an array, and not an empty object.
        if (Array.isArray(res.body.openSubsonicExtensions)) {
            for (const extension of res.body.openSubsonicExtensions) {
                navidromeFeatures[extension.name] = extension.versions;
            }
        }
    }

    const features: ServerFeatures = {
        lyricsMultipleStructured: !!navidromeFeatures[SubsonicExtensions.SONG_LYRICS],
        playlistsSmart: !!navidromeFeatures[ServerFeature.PLAYLISTS_SMART],
        sharingAlbumSong: !!navidromeFeatures[ServerFeature.SHARING_ALBUM_SONG],
    };

    return { features, id: apiClientProps.server?.id, version: ping.body.serverVersion! };
};

const shareItem = async (args: ShareItemArgs): Promise<ShareItemResponse> => {
    const { body, apiClientProps } = args;

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
};

const getSimilarSongs = async (args: SimilarSongsArgs): Promise<Song[]> => {
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
                acc.push(ssNormalize.song(song, apiClientProps.server, ''));
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
            album_artist_id: query.albumArtistIds,
        },
    });

    if (fallback.status !== 200) {
        throw new Error('Failed to get similar songs');
    }

    return fallback.body.data.reduce<Song[]>((acc, song) => {
        if (song.id !== query.songId) {
            acc.push(ndNormalize.song(song, apiClientProps.server, ''));
        }

        return acc;
    }, []);
};

export const ndController = {
    addToPlaylist,
    authenticate,
    createPlaylist,
    deletePlaylist,
    getAlbumArtistDetail,
    getAlbumArtistList,
    getAlbumDetail,
    getAlbumList,
    getGenreList,
    getPlaylistDetail,
    getPlaylistList,
    getPlaylistSongList,
    getServerInfo,
    getSimilarSongs,
    getSongDetail,
    getSongList,
    getUserList,
    removeFromPlaylist,
    shareItem,
    updatePlaylist,
};
