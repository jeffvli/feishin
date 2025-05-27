import i18n from '/@/i18n/i18n';
import { JellyfinController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import { NavidromeController } from '/@/renderer/api/navidrome/navidrome-controller';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import { useAuthStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import {
    AuthenticationResponse,
    ControllerEndpoint,
    ServerType,
} from '/@/shared/types/domain-types';

type ApiController = {
    jellyfin: ControllerEndpoint;
    navidrome: ControllerEndpoint;
    subsonic: ControllerEndpoint;
};

const endpoints: ApiController = {
    jellyfin: JellyfinController,
    navidrome: NavidromeController,
    subsonic: SubsonicController,
};

const apiController = <K extends keyof ControllerEndpoint>(
    endpoint: K,
    type?: ServerType,
): NonNullable<ControllerEndpoint[K]> => {
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

    return controllerFn;
};

export interface GeneralController extends Omit<Required<ControllerEndpoint>, 'authenticate'> {
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
        type: ServerType,
    ) => Promise<AuthenticationResponse>;
}

export const controller: GeneralController = {
    addToPlaylist(args) {
        return apiController('addToPlaylist', args.apiClientProps.server?.type)?.(args);
    },
    authenticate(url, body, type) {
        return apiController('authenticate', type)(url, body);
    },
    createFavorite(args) {
        return apiController('createFavorite', args.apiClientProps.server?.type)?.(args);
    },
    createPlaylist(args) {
        return apiController('createPlaylist', args.apiClientProps.server?.type)?.(args);
    },
    deleteFavorite(args) {
        return apiController('deleteFavorite', args.apiClientProps.server?.type)?.(args);
    },
    deletePlaylist(args) {
        return apiController('deletePlaylist', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumArtistDetail(args) {
        return apiController('getAlbumArtistDetail', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumArtistList(args) {
        return apiController('getAlbumArtistList', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumArtistListCount(args) {
        return apiController('getAlbumArtistListCount', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumDetail(args) {
        return apiController('getAlbumDetail', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumInfo(args) {
        return apiController('getAlbumInfo', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumList(args) {
        return apiController('getAlbumList', args.apiClientProps.server?.type)?.(args);
    },
    getAlbumListCount(args) {
        return apiController('getAlbumListCount', args.apiClientProps.server?.type)?.(args);
    },
    getArtistList(args) {
        return apiController('getArtistList', args.apiClientProps.server?.type)?.(args);
    },
    getArtistListCount(args) {
        return apiController('getArtistListCount', args.apiClientProps.server?.type)?.(args);
    },
    getDownloadUrl(args) {
        return apiController('getDownloadUrl', args.apiClientProps.server?.type)?.(args);
    },
    getGenreList(args) {
        return apiController('getGenreList', args.apiClientProps.server?.type)?.(args);
    },
    getLyrics(args) {
        return apiController('getLyrics', args.apiClientProps.server?.type)?.(args);
    },
    getMusicFolderList(args) {
        return apiController('getMusicFolderList', args.apiClientProps.server?.type)?.(args);
    },
    getPlaylistDetail(args) {
        return apiController('getPlaylistDetail', args.apiClientProps.server?.type)?.(args);
    },
    getPlaylistList(args) {
        return apiController('getPlaylistList', args.apiClientProps.server?.type)?.(args);
    },
    getPlaylistListCount(args) {
        return apiController('getPlaylistListCount', args.apiClientProps.server?.type)?.(args);
    },
    getPlaylistSongList(args) {
        return apiController('getPlaylistSongList', args.apiClientProps.server?.type)?.(args);
    },
    getRandomSongList(args) {
        return apiController('getRandomSongList', args.apiClientProps.server?.type)?.(args);
    },
    getRoles(args) {
        return apiController('getRoles', args.apiClientProps.server?.type)?.(args);
    },
    getServerInfo(args) {
        return apiController('getServerInfo', args.apiClientProps.server?.type)?.(args);
    },
    getSimilarSongs(args) {
        return apiController('getSimilarSongs', args.apiClientProps.server?.type)?.(args);
    },
    getSongDetail(args) {
        return apiController('getSongDetail', args.apiClientProps.server?.type)?.(args);
    },
    getSongList(args) {
        return apiController('getSongList', args.apiClientProps.server?.type)?.(args);
    },
    getSongListCount(args) {
        return apiController('getSongListCount', args.apiClientProps.server?.type)?.(args);
    },
    getStructuredLyrics(args) {
        return apiController('getStructuredLyrics', args.apiClientProps.server?.type)?.(args);
    },
    getTags(args) {
        return apiController('getTags', args.apiClientProps.server?.type)?.(args);
    },
    getTopSongs(args) {
        return apiController('getTopSongs', args.apiClientProps.server?.type)?.(args);
    },
    getTranscodingUrl(args) {
        return apiController('getTranscodingUrl', args.apiClientProps.server?.type)?.(args);
    },
    getUserList(args) {
        return apiController('getUserList', args.apiClientProps.server?.type)?.(args);
    },
    movePlaylistItem(args) {
        return apiController('movePlaylistItem', args.apiClientProps.server?.type)?.(args);
    },
    removeFromPlaylist(args) {
        return apiController('removeFromPlaylist', args.apiClientProps.server?.type)?.(args);
    },
    scrobble(args) {
        return apiController('scrobble', args.apiClientProps.server?.type)?.(args);
    },
    search(args) {
        return apiController('search', args.apiClientProps.server?.type)?.(args);
    },
    setRating(args) {
        return apiController('setRating', args.apiClientProps.server?.type)?.(args);
    },
    shareItem(args) {
        return apiController('shareItem', args.apiClientProps.server?.type)?.(args);
    },
    updatePlaylist(args) {
        return apiController('updatePlaylist', args.apiClientProps.server?.type)?.(args);
    },
};
