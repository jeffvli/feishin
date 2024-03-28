import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/renderer/components/toast/index';
import type {
    AlbumDetailArgs,
    AlbumListArgs,
    SongListArgs,
    SongDetailArgs,
    AlbumArtistDetailArgs,
    AlbumArtistListArgs,
    SetRatingArgs,
    ShareItemArgs,
    GenreListArgs,
    CreatePlaylistArgs,
    DeletePlaylistArgs,
    PlaylistDetailArgs,
    PlaylistListArgs,
    MusicFolderListArgs,
    PlaylistSongListArgs,
    ArtistListArgs,
    UpdatePlaylistArgs,
    UserListArgs,
    FavoriteArgs,
    TopSongListArgs,
    AddToPlaylistArgs,
    AddToPlaylistResponse,
    RemoveFromPlaylistArgs,
    RemoveFromPlaylistResponse,
    ScrobbleArgs,
    ScrobbleResponse,
    AlbumArtistDetailResponse,
    FavoriteResponse,
    CreatePlaylistResponse,
    AlbumArtistListResponse,
    AlbumDetailResponse,
    AlbumListResponse,
    ArtistListResponse,
    GenreListResponse,
    MusicFolderListResponse,
    PlaylistDetailResponse,
    PlaylistListResponse,
    RatingResponse,
    SongDetailResponse,
    SongListResponse,
    TopSongListResponse,
    UpdatePlaylistResponse,
    UserListResponse,
    AuthenticationResponse,
    SearchArgs,
    SearchResponse,
    LyricsArgs,
    LyricsResponse,
    ServerInfo,
    ServerInfoArgs,
    StructuredLyricsArgs,
    StructuredLyric,
    SimilarSongsArgs,
    Song,
    ServerType,
    ShareItemResponse,
} from '/@/renderer/api/types';
import { DeletePlaylistResponse, RandomSongListArgs } from './types';
import { ndController } from '/@/renderer/api/navidrome/navidrome-controller';
import { ssController } from '/@/renderer/api/subsonic/subsonic-controller';
import { jfController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import i18n from '/@/i18n/i18n';

export type ControllerEndpoint = Partial<{
    addToPlaylist: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    clearPlaylist: () => void;
    createFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    createPlaylist: (args: CreatePlaylistArgs) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    deletePlaylist: (args: DeletePlaylistArgs) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (args: AlbumArtistDetailArgs) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (args: AlbumArtistListArgs) => Promise<AlbumArtistListResponse>;
    getAlbumDetail: (args: AlbumDetailArgs) => Promise<AlbumDetailResponse>;
    getAlbumList: (args: AlbumListArgs) => Promise<AlbumListResponse>;
    getArtistDetail: () => void;
    getArtistInfo: (args: any) => void;
    getArtistList: (args: ArtistListArgs) => Promise<ArtistListResponse>;
    getFavoritesList: () => void;
    getFolderItemList: () => void;
    getFolderList: () => void;
    getFolderSongs: () => void;
    getGenreList: (args: GenreListArgs) => Promise<GenreListResponse>;
    getLyrics: (args: LyricsArgs) => Promise<LyricsResponse>;
    getMusicFolderList: (args: MusicFolderListArgs) => Promise<MusicFolderListResponse>;
    getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (args: PlaylistListArgs) => Promise<PlaylistListResponse>;
    getPlaylistSongList: (args: PlaylistSongListArgs) => Promise<SongListResponse>;
    getRandomSongList: (args: RandomSongListArgs) => Promise<SongListResponse>;
    getServerInfo: (args: ServerInfoArgs) => Promise<ServerInfo>;
    getSimilarSongs: (args: SimilarSongsArgs) => Promise<Song[]>;
    getSongDetail: (args: SongDetailArgs) => Promise<SongDetailResponse>;
    getSongList: (args: SongListArgs) => Promise<SongListResponse>;
    getStructuredLyrics: (args: StructuredLyricsArgs) => Promise<StructuredLyric[]>;
    getTopSongs: (args: TopSongListArgs) => Promise<TopSongListResponse>;
    getUserList: (args: UserListArgs) => Promise<UserListResponse>;
    removeFromPlaylist: (args: RemoveFromPlaylistArgs) => Promise<RemoveFromPlaylistResponse>;
    scrobble: (args: ScrobbleArgs) => Promise<ScrobbleResponse>;
    search: (args: SearchArgs) => Promise<SearchResponse>;
    setRating: (args: SetRatingArgs) => Promise<RatingResponse>;
    shareItem: (args: ShareItemArgs) => Promise<ShareItemResponse>;
    updatePlaylist: (args: UpdatePlaylistArgs) => Promise<UpdatePlaylistResponse>;
}>;

type ApiController = {
    jellyfin: ControllerEndpoint;
    navidrome: ControllerEndpoint;
    subsonic: ControllerEndpoint;
};

const endpoints: ApiController = {
    jellyfin: {
        addToPlaylist: jfController.addToPlaylist,
        authenticate: jfController.authenticate,
        clearPlaylist: undefined,
        createFavorite: jfController.createFavorite,
        createPlaylist: jfController.createPlaylist,
        deleteFavorite: jfController.deleteFavorite,
        deletePlaylist: jfController.deletePlaylist,
        getAlbumArtistDetail: jfController.getAlbumArtistDetail,
        getAlbumArtistList: jfController.getAlbumArtistList,
        getAlbumDetail: jfController.getAlbumDetail,
        getAlbumList: jfController.getAlbumList,
        getArtistDetail: undefined,
        getArtistInfo: undefined,
        getArtistList: undefined,
        getFavoritesList: undefined,
        getFolderItemList: undefined,
        getFolderList: undefined,
        getFolderSongs: undefined,
        getGenreList: jfController.getGenreList,
        getLyrics: jfController.getLyrics,
        getMusicFolderList: jfController.getMusicFolderList,
        getPlaylistDetail: jfController.getPlaylistDetail,
        getPlaylistList: jfController.getPlaylistList,
        getPlaylistSongList: jfController.getPlaylistSongList,
        getRandomSongList: jfController.getRandomSongList,
        getServerInfo: jfController.getServerInfo,
        getSimilarSongs: jfController.getSimilarSongs,
        getSongDetail: jfController.getSongDetail,
        getSongList: jfController.getSongList,
        getStructuredLyrics: undefined,
        getTopSongs: jfController.getTopSongList,
        getUserList: undefined,
        removeFromPlaylist: jfController.removeFromPlaylist,
        scrobble: jfController.scrobble,
        search: jfController.search,
        setRating: undefined,
        shareItem: undefined,
        updatePlaylist: jfController.updatePlaylist,
    },
    navidrome: {
        addToPlaylist: ndController.addToPlaylist,
        authenticate: ndController.authenticate,
        clearPlaylist: undefined,
        createFavorite: ssController.createFavorite,
        createPlaylist: ndController.createPlaylist,
        deleteFavorite: ssController.removeFavorite,
        deletePlaylist: ndController.deletePlaylist,
        getAlbumArtistDetail: ndController.getAlbumArtistDetail,
        getAlbumArtistList: ndController.getAlbumArtistList,
        getAlbumDetail: ndController.getAlbumDetail,
        getAlbumList: ndController.getAlbumList,
        getArtistDetail: undefined,
        getArtistInfo: undefined,
        getArtistList: undefined,
        getFavoritesList: undefined,
        getFolderItemList: undefined,
        getFolderList: undefined,
        getFolderSongs: undefined,
        getGenreList: ndController.getGenreList,
        getLyrics: undefined,
        getMusicFolderList: ssController.getMusicFolderList,
        getPlaylistDetail: ndController.getPlaylistDetail,
        getPlaylistList: ndController.getPlaylistList,
        getPlaylistSongList: ndController.getPlaylistSongList,
        getRandomSongList: ssController.getRandomSongList,
        getServerInfo: ndController.getServerInfo,
        getSimilarSongs: ssController.getSimilarSongs,
        getSongDetail: ndController.getSongDetail,
        getSongList: ndController.getSongList,
        getStructuredLyrics: ssController.getStructuredLyrics,
        getTopSongs: ssController.getTopSongList,
        getUserList: ndController.getUserList,
        removeFromPlaylist: ndController.removeFromPlaylist,
        scrobble: ssController.scrobble,
        search: ssController.search3,
        setRating: ssController.setRating,
        shareItem: ndController.shareItem,
        updatePlaylist: ndController.updatePlaylist,
    },
    subsonic: {
        authenticate: ssController.authenticate,
        clearPlaylist: undefined,
        createFavorite: ssController.createFavorite,
        createPlaylist: undefined,
        deleteFavorite: ssController.removeFavorite,
        deletePlaylist: undefined,
        getAlbumArtistDetail: undefined,
        getAlbumArtistList: undefined,
        getAlbumDetail: undefined,
        getAlbumList: undefined,
        getArtistDetail: undefined,
        getArtistInfo: undefined,
        getArtistList: undefined,
        getFavoritesList: undefined,
        getFolderItemList: undefined,
        getFolderList: undefined,
        getFolderSongs: undefined,
        getGenreList: undefined,
        getLyrics: undefined,
        getMusicFolderList: ssController.getMusicFolderList,
        getPlaylistDetail: undefined,
        getPlaylistList: undefined,
        getServerInfo: ssController.getServerInfo,
        getSimilarSongs: ssController.getSimilarSongs,
        getSongDetail: undefined,
        getSongList: undefined,
        getStructuredLyrics: ssController.getStructuredLyrics,
        getTopSongs: ssController.getTopSongList,
        getUserList: undefined,
        scrobble: ssController.scrobble,
        search: ssController.search3,
        setRating: undefined,
        shareItem: undefined,
        updatePlaylist: undefined,
    },
};

const apiController = (endpoint: keyof ControllerEndpoint, type?: ServerType) => {
    const serverType = type || useAuthStore.getState().currentServer?.type;

    if (!serverType) {
        toast.error({
            message: i18n.t('error.serverNotSelectedError', {
                postProcess: 'sentenceCase',
            }) as string,
            title: i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' }) as string,
        });
        throw new Error(`No server selected`);
    }

    const controllerFn = endpoints?.[serverType]?.[endpoint];

    if (typeof controllerFn !== 'function') {
        toast.error({
            message: `Endpoint ${endpoint} is not implemented for ${serverType}`,
            title: i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' }) as string,
        });

        throw new Error(
            i18n.t('error.endpointNotImplementedError', {
                endpoint,
                postProcess: 'sentenceCase',
                serverType,
            }) as string,
        );
    }

    return endpoints[serverType][endpoint];
};

const authenticate = async (
    url: string,
    body: { legacy?: boolean; password: string; username: string },
    type: ServerType,
) => {
    return (apiController('authenticate', type) as ControllerEndpoint['authenticate'])?.(url, body);
};

const getAlbumList = async (args: AlbumListArgs) => {
    return (
        apiController(
            'getAlbumList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getAlbumList']
    )?.(args);
};

const getAlbumDetail = async (args: AlbumDetailArgs) => {
    return (
        apiController(
            'getAlbumDetail',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getAlbumDetail']
    )?.(args);
};

const getSongList = async (args: SongListArgs) => {
    return (
        apiController(
            'getSongList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getSongList']
    )?.(args);
};

const getSongDetail = async (args: SongDetailArgs) => {
    return (
        apiController(
            'getSongDetail',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getSongDetail']
    )?.(args);
};

const getMusicFolderList = async (args: MusicFolderListArgs) => {
    return (
        apiController(
            'getMusicFolderList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getMusicFolderList']
    )?.(args);
};

const getGenreList = async (args: GenreListArgs) => {
    return (
        apiController(
            'getGenreList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getGenreList']
    )?.(args);
};

const getAlbumArtistDetail = async (args: AlbumArtistDetailArgs) => {
    return (
        apiController(
            'getAlbumArtistDetail',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getAlbumArtistDetail']
    )?.(args);
};

const getAlbumArtistList = async (args: AlbumArtistListArgs) => {
    return (
        apiController(
            'getAlbumArtistList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getAlbumArtistList']
    )?.(args);
};

const getArtistList = async (args: ArtistListArgs) => {
    return (
        apiController(
            'getArtistList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getArtistList']
    )?.(args);
};

const getPlaylistList = async (args: PlaylistListArgs) => {
    return (
        apiController(
            'getPlaylistList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getPlaylistList']
    )?.(args);
};

const createPlaylist = async (args: CreatePlaylistArgs) => {
    return (
        apiController(
            'createPlaylist',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['createPlaylist']
    )?.(args);
};

const updatePlaylist = async (args: UpdatePlaylistArgs) => {
    return (
        apiController(
            'updatePlaylist',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['updatePlaylist']
    )?.(args);
};

const deletePlaylist = async (args: DeletePlaylistArgs) => {
    return (
        apiController(
            'deletePlaylist',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['deletePlaylist']
    )?.(args);
};

const addToPlaylist = async (args: AddToPlaylistArgs) => {
    return (
        apiController(
            'addToPlaylist',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['addToPlaylist']
    )?.(args);
};

const removeFromPlaylist = async (args: RemoveFromPlaylistArgs) => {
    return (
        apiController(
            'removeFromPlaylist',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['removeFromPlaylist']
    )?.(args);
};

const getPlaylistDetail = async (args: PlaylistDetailArgs) => {
    return (
        apiController(
            'getPlaylistDetail',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getPlaylistDetail']
    )?.(args);
};

const getPlaylistSongList = async (args: PlaylistSongListArgs) => {
    return (
        apiController(
            'getPlaylistSongList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getPlaylistSongList']
    )?.(args);
};

const getUserList = async (args: UserListArgs) => {
    return (
        apiController(
            'getUserList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getUserList']
    )?.(args);
};

const createFavorite = async (args: FavoriteArgs) => {
    return (
        apiController(
            'createFavorite',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['createFavorite']
    )?.(args);
};

const deleteFavorite = async (args: FavoriteArgs) => {
    return (
        apiController(
            'deleteFavorite',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['deleteFavorite']
    )?.(args);
};

const updateRating = async (args: SetRatingArgs) => {
    return (
        apiController(
            'setRating',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['setRating']
    )?.(args);
};

const shareItem = async (args: ShareItemArgs) => {
    return (
        apiController(
            'shareItem',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['shareItem']
    )?.(args);
};

const getTopSongList = async (args: TopSongListArgs) => {
    return (
        apiController(
            'getTopSongs',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getTopSongs']
    )?.(args);
};

const scrobble = async (args: ScrobbleArgs) => {
    return (
        apiController(
            'scrobble',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['scrobble']
    )?.(args);
};

const search = async (args: SearchArgs) => {
    return (
        apiController('search', args.apiClientProps.server?.type) as ControllerEndpoint['search']
    )?.(args);
};

const getRandomSongList = async (args: RandomSongListArgs) => {
    return (
        apiController(
            'getRandomSongList',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getRandomSongList']
    )?.(args);
};

const getLyrics = async (args: LyricsArgs) => {
    return (
        apiController(
            'getLyrics',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getLyrics']
    )?.(args);
};

const getServerInfo = async (args: ServerInfoArgs) => {
    return (
        apiController(
            'getServerInfo',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getServerInfo']
    )?.(args);
};

const getStructuredLyrics = async (args: StructuredLyricsArgs) => {
    return (
        apiController(
            'getStructuredLyrics',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getStructuredLyrics']
    )?.(args);
};

const getSimilarSongs = async (args: SimilarSongsArgs) => {
    return (
        apiController(
            'getSimilarSongs',
            args.apiClientProps.server?.type,
        ) as ControllerEndpoint['getSimilarSongs']
    )?.(args);
};

export const controller = {
    addToPlaylist,
    authenticate,
    createFavorite,
    createPlaylist,
    deleteFavorite,
    deletePlaylist,
    getAlbumArtistDetail,
    getAlbumArtistList,
    getAlbumDetail,
    getAlbumList,
    getArtistList,
    getGenreList,
    getLyrics,
    getMusicFolderList,
    getPlaylistDetail,
    getPlaylistList,
    getPlaylistSongList,
    getRandomSongList,
    getServerInfo,
    getSimilarSongs,
    getSongDetail,
    getSongList,
    getStructuredLyrics,
    getTopSongList,
    getUserList,
    removeFromPlaylist,
    scrobble,
    search,
    shareItem,
    updatePlaylist,
    updateRating,
};
