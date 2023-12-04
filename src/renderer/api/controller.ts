import { RandomSongListArgs } from './types';
import i18n from '/@/i18n/i18n';
import { jfController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import { NavidromeController } from '/@/renderer/api/navidrome/navidrome-controller';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import type {
    AddToPlaylistArgs,
    AlbumArtistDetailArgs,
    AlbumArtistListArgs,
    AlbumDetailArgs,
    AlbumListArgs,
    ArtistListArgs,
    ControllerEndpoint,
    CreatePlaylistArgs,
    DeletePlaylistArgs,
    FavoriteArgs,
    GenreListArgs,
    LyricsArgs,
    MusicFolderListArgs,
    PlaylistDetailArgs,
    PlaylistListArgs,
    PlaylistSongListArgs,
    RemoveFromPlaylistArgs,
    ScrobbleArgs,
    SearchArgs,
    SetRatingArgs,
    SongDetailArgs,
    SongListArgs,
    TopSongListArgs,
    UpdatePlaylistArgs,
    UserListArgs,
} from '/@/renderer/api/types';
import { toast } from '/@/renderer/components/toast/index';
import { useAuthStore } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';

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
        getSongDetail: jfController.getSongDetail,
        getSongList: jfController.getSongList,
        getTopSongs: jfController.getTopSongList,
        getUserList: undefined,
        removeFromPlaylist: jfController.removeFromPlaylist,
        scrobble: jfController.scrobble,
        search: jfController.search,
        setRating: undefined,
        updatePlaylist: jfController.updatePlaylist,
    },
    navidrome: NavidromeController,
    subsonic: SubsonicController,
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
    getSongDetail,
    getSongList,
    getTopSongList,
    getUserList,
    removeFromPlaylist,
    scrobble,
    search,
    updatePlaylist,
    updateRating,
};
