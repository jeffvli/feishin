import i18n from '/@/i18n/i18n';
import { JellyfinController } from '/@/renderer/api/jellyfin/jellyfin-controller';
import { NavidromeController } from '/@/renderer/api/navidrome/navidrome-controller';
import { SubsonicController } from '/@/renderer/api/subsonic/subsonic-controller';
import { mergeMusicFolderId } from '/@/renderer/api/utils-music-folder';
import { getServerById, useAuthStore, useSettingsStore } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import {
    AuthenticationResponse,
    ControllerEndpoint,
    InternalControllerEndpoint,
    ServerType,
} from '/@/shared/types/domain-types';

type ApiController = {
    jellyfin: InternalControllerEndpoint;
    navidrome: InternalControllerEndpoint;
    subsonic: InternalControllerEndpoint;
};

const endpoints: ApiController = {
    jellyfin: JellyfinController,
    navidrome: NavidromeController,
    subsonic: SubsonicController,
};

const apiController = <K extends keyof ControllerEndpoint>(
    endpoint: K,
    type?: ServerType,
): NonNullable<InternalControllerEndpoint[K]> => {
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

const getPathReplaceSettings = () => {
    const { pathReplace, pathReplaceWith } = useSettingsStore.getState().general;
    return { pathReplace, pathReplaceWith };
};

const addContext = <T extends { apiClientProps: any; context?: any }>(args: T): T => {
    const pathSettings = getPathReplaceSettings();
    return {
        ...args,
        context: {
            ...(args.context || {}),
            ...pathSettings,
        },
    };
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
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: addToPlaylist`,
            );
        }

        return apiController(
            'addToPlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    authenticate(url, body, type) {
        return apiController('authenticate', type)(url, body);
    },
    createFavorite(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: createFavorite`,
            );
        }

        return apiController(
            'createFavorite',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    createInternetRadioStation(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: createInternetRadioStation`,
            );
        }

        return apiController(
            'createInternetRadioStation',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    createPlaylist(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: createPlaylist`,
            );
        }

        return apiController(
            'createPlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    deleteFavorite(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: deleteFavorite`,
            );
        }

        return apiController(
            'deleteFavorite',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    deleteInternetRadioStation(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: deleteInternetRadioStation`,
            );
        }

        return apiController(
            'deleteInternetRadioStation',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    deletePlaylist(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: deletePlaylist`,
            );
        }

        return apiController(
            'deletePlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getAlbumArtistDetail(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumArtistDetail`,
            );
        }

        return apiController(
            'getAlbumArtistDetail',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getAlbumArtistList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumArtistList`,
            );
        }

        return apiController(
            'getAlbumArtistList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getAlbumArtistListCount(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumArtistListCount`,
            );
        }

        return apiController(
            'getAlbumArtistListCount',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getAlbumDetail(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumDetail`,
            );
        }

        return apiController(
            'getAlbumDetail',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getAlbumInfo(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumInfo`,
            );
        }

        return apiController(
            'getAlbumInfo',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getAlbumList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumList`,
            );
        }

        return apiController(
            'getAlbumList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getAlbumListCount(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getAlbumListCount`,
            );
        }

        return apiController(
            'getAlbumListCount',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getArtistList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getArtistList`,
            );
        }

        return apiController(
            'getArtistList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getArtistListCount(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getArtistListCount`,
            );
        }

        return apiController(
            'getArtistListCount',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getArtistRadio(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getArtistRadio`,
            );
        }

        return apiController(
            'getArtistRadio',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getDownloadUrl(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getDownloadUrl`,
            );
        }

        return apiController(
            'getDownloadUrl',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getFolder(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getFolder`,
            );
        }

        return apiController(
            'getFolder',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getGenreList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getGenreList`,
            );
        }

        return apiController(
            'getGenreList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getImageUrl(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            return null;
        }

        return (
            apiController(
                'getImageUrl',
                server.type,
            )?.(
                addContext({
                    ...args,
                    apiClientProps: { ...args.apiClientProps, server },
                }),
            ) || null
        );
    },
    getInternetRadioStations(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getInternetRadioStations`,
            );
        }
        return apiController(
            'getInternetRadioStations',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getLyrics(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getLyrics`,
            );
        }

        return apiController(
            'getLyrics',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getMusicFolderList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getMusicFolderList`,
            );
        }

        return apiController(
            'getMusicFolderList',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getPlaylistDetail(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getPlaylistDetail`,
            );
        }

        return apiController(
            'getPlaylistDetail',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getPlaylistList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getPlaylistList`,
            );
        }

        return apiController(
            'getPlaylistList',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getPlaylistListCount(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getPlaylistListCount`,
            );
        }

        return apiController(
            'getPlaylistListCount',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getPlaylistSongList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getPlaylistSongList`,
            );
        }

        return apiController(
            'getPlaylistSongList',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getPlayQueue(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getPlayQueue`,
            );
        }

        return apiController(
            'getPlayQueue',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getRandomSongList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getRandomSongList`,
            );
        }

        return apiController(
            'getRandomSongList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getRoles(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getRoles`,
            );
        }

        return apiController(
            'getRoles',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getServerInfo(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getServerInfo`,
            );
        }

        return apiController(
            'getServerInfo',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getSimilarSongs(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getSimilarSongs`,
            );
        }

        return apiController(
            'getSimilarSongs',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getSongDetail(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getSongDetail`,
            );
        }

        return apiController(
            'getSongDetail',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getSongList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getSongList`,
            );
        }

        return apiController(
            'getSongList',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getSongListCount(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getSongListCount`,
            );
        }

        return apiController(
            'getSongListCount',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    getStreamUrl(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            return '';
        }

        return apiController(
            'getStreamUrl',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getStructuredLyrics(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getStructuredLyrics`,
            );
        }

        return apiController(
            'getStructuredLyrics',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getTagList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getTags`,
            );
        }

        return apiController(
            'getTagList',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getTopSongs(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getTopSongs`,
            );
        }

        return apiController(
            'getTopSongs',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getUserInfo(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getUserInfo`,
            );
        }

        return apiController(
            'getUserInfo',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    getUserList(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: getUserList`,
            );
        }

        return apiController(
            'getUserList',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    movePlaylistItem(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: movePlaylistItem`,
            );
        }

        return apiController(
            'movePlaylistItem',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    removeFromPlaylist(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: removeFromPlaylist`,
            );
        }

        return apiController(
            'removeFromPlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    replacePlaylist(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: replacePlaylist`,
            );
        }

        return apiController(
            'replacePlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    savePlayQueue(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: savePlayQueue`,
            );
        }

        return apiController(
            'savePlayQueue',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    scrobble(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: scrobble`,
            );
        }

        return apiController(
            'scrobble',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    search(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: search`,
            );
        }

        return apiController(
            'search',
            server.type,
        )?.(
            addContext({
                ...args,
                apiClientProps: { ...args.apiClientProps, server },
                query: mergeMusicFolderId(args.query, server),
            }),
        );
    },
    setRating(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: setRating`,
            );
        }

        return apiController(
            'setRating',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    shareItem(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: shareItem`,
            );
        }

        return apiController(
            'shareItem',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    updateInternetRadioStation(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: updateInternetRadioStation`,
            );
        }

        return apiController(
            'updateInternetRadioStation',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
    updatePlaylist(args) {
        const server = getServerById(args.apiClientProps.serverId);

        if (!server) {
            throw new Error(
                `${i18n.t('error.apiRouteError', { postProcess: 'sentenceCase' })}: updatePlaylist`,
            );
        }

        return apiController(
            'updatePlaylist',
            server.type,
        )?.(addContext({ ...args, apiClientProps: { ...args.apiClientProps, server } }));
    },
};
