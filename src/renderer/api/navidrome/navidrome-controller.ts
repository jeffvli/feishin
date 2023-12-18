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
    ControllerEndpoint,
} from '../types';
import { ndApiClient } from '/@/renderer/api/navidrome/navidrome-api';
import { ndNormalize } from '/@/renderer/api/navidrome/navidrome-normalize';
import { ndType } from '/@/renderer/api/navidrome/navidrome-types';
import { subsonicApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';

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

    const artistInfoRes = await subsonicApiClient(apiClientProps).getArtistInfo({
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

    return ndNormalize.albumArtist(
        {
            ...res.body.data,
            ...(artistInfoRes.status === 200 && {
                similarArtists: artistInfoRes.body['subsonic-response'].artistInfo.similarArtist,
                ...(!res.body.data.largeImageUrl && {
                    largeImageUrl: artistInfoRes.body['subsonic-response'].artistInfo.largeImageUrl,
                }),
                ...(!res.body.data.mediumImageUrl && {
                    largeImageUrl:
                        artistInfoRes.body['subsonic-response'].artistInfo.mediumImageUrl,
                }),
                ...(!res.body.data.smallImageUrl && {
                    largeImageUrl: artistInfoRes.body['subsonic-response'].artistInfo.smallImageUrl,
                }),
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
            ndNormalize.albumArtist(albumArtist, apiClientProps.server),
        ),
        startIndex: query.startIndex,
        totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
    };
};

const getAlbumArtistListCount = async (args: AlbumArtistListArgs): Promise<number> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getAlbumArtistList({
        query: {
            _end: 1,
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: albumArtistListSortMap.navidrome[query.sortBy],
            _start: 0,
            name: query.searchTerm,
            ...query._custom?.navidrome,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get album artist list count');
    }

    return Number(res.body.headers.get('x-total-count') || 0);
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
            compilation: query.isCompilation,
            genre_id: query.genre,
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

const getAlbumListCount = async (args: AlbumListArgs): Promise<number> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getAlbumList({
        query: {
            _end: 1,
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: albumListSortMap.navidrome[query.sortBy],
            _start: 0,
            artist_id: query.artistIds?.[0],
            compilation: query.isCompilation,
            genre_id: query.genre,
            name: query.searchTerm,
            ...query._custom?.navidrome,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get album list');
    }

    return Number(res.body.headers.get('x-total-count') || 0);
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

const getSongListCount = async (args: SongListArgs): Promise<number> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getSongList({
        query: {
            _end: 1,
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: songListSortMap.navidrome[query.sortBy],
            _start: 0,
            album_artist_id: query.artistIds,
            album_id: query.albumIds,
            title: query.searchTerm,
            ...query._custom?.navidrome,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get song list count');
    }

    return Number(res.body.headers.get('x-total-count') || 0);
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
            public: body.public,
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
            sync: body._custom?.navidrome?.sync,
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

    const res = await ndApiClient(apiClientProps).getPlaylistList({
        query: {
            _end: query.startIndex + (query.limit || 0),
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: query.sortBy
                ? playlistListSortMap.navidrome[query.sortBy]
                : playlistListSortMap.navidrome.name,
            _start: query.startIndex,
            q: query.searchTerm,
            ...query._custom?.navidrome,
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

const getPlaylistListCount = async (args: PlaylistListArgs): Promise<number> => {
    const { query, apiClientProps } = args;

    const res = await ndApiClient(apiClientProps).getPlaylistList({
        query: {
            _end: 1,
            _order: sortOrderMap.navidrome[query.sortOrder],
            _sort: query.sortBy
                ? playlistListSortMap.navidrome[query.sortBy]
                : playlistListSortMap.navidrome.name,
            _start: 0,
            q: query.searchTerm,
            ...query._custom?.navidrome,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist list count');
    }

    return Number(res.body.headers.get('x-total-count') || 0);
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
            _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : 'ASC',
            _sort: query.sortBy
                ? songListSortMap.navidrome[query.sortBy]
                : ndType._enum.songList.ID,
            _start: 0,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist song list');
    }

    return {
        items: res.body.data.map((item) => ndNormalize.song(item, apiClientProps.server, '')),
        startIndex: 0,
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

export const NavidromeController: ControllerEndpoint = {
    addToPlaylist,
    authenticate,
    clearPlaylist: undefined,
    createFavorite: SubsonicController.createFavorite,
    createPlaylist,
    deleteFavorite: SubsonicController.deleteFavorite,
    deletePlaylist,
    getAlbumArtistDetail,
    getAlbumArtistList,
    getAlbumArtistListCount,
    getAlbumDetail,
    getAlbumList,
    getAlbumListCount,
    getArtistDetail: undefined,
    getArtistInfo: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList,
    getMusicFolderList: SubsonicController.getMusicFolderList,
    getPlaylistDetail,
    getPlaylistList,
    getPlaylistListCount,
    getPlaylistSongList,
    getRandomSongList: SubsonicController.getRandomSongList,
    getSongDetail,
    getSongList,
    getSongListCount,
    getTopSongs: SubsonicController.getTopSongs,
    getUserList,
    removeFromPlaylist,
    scrobble: SubsonicController.scrobble,
    search: SubsonicController.search,
    setRating: SubsonicController.setRating,
    updatePlaylist,
};
