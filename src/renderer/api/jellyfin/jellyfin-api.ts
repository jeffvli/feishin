import { useAuthStore } from '/@/renderer/store';
import { jfType } from '/@/renderer/api/jellyfin/jellyfin-types';
import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosResponse, isAxiosError, Method } from 'axios';
import qs from 'qs';
import { ServerListItem } from '/@/renderer/api/types';
import omitBy from 'lodash/omitBy';
import { z } from 'zod';
import { authenticationFailure } from '/@/renderer/api/utils';
import i18n from '/@/i18n/i18n';

const c = initContract();

export const contract = c.router({
    addToPlaylist: {
        body: z.null(),
        method: 'POST',
        path: 'playlists/:id/items',
        query: jfType._parameters.addToPlaylist,
        responses: {
            204: jfType._response.addToPlaylist,
            400: jfType._response.error,
        },
    },
    authenticate: {
        body: jfType._parameters.authenticate,
        headers: z.object({
            'X-Emby-Authorization': z.string(),
        }),
        method: 'POST',
        path: 'users/authenticatebyname',
        responses: {
            200: jfType._response.authenticate,
            400: jfType._response.error,
        },
    },
    createFavorite: {
        body: jfType._parameters.favorite,
        method: 'POST',
        path: 'users/:userId/favoriteitems/:id',
        responses: {
            200: jfType._response.favorite,
            400: jfType._response.error,
        },
    },
    createPlaylist: {
        body: jfType._parameters.createPlaylist,
        method: 'POST',
        path: 'playlists',
        responses: {
            200: jfType._response.createPlaylist,
            400: jfType._response.error,
        },
    },
    deletePlaylist: {
        body: null,
        method: 'DELETE',
        path: 'items/:id',
        responses: {
            204: jfType._response.deletePlaylist,
            400: jfType._response.error,
        },
    },
    getAlbumArtistDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: jfType._parameters.albumArtistDetail,
        responses: {
            200: jfType._response.albumArtist,
            400: jfType._response.error,
        },
    },
    getAlbumArtistList: {
        method: 'GET',
        path: 'artists/albumArtists',
        query: jfType._parameters.albumArtistList,
        responses: {
            200: jfType._response.albumArtistList,
            400: jfType._response.error,
        },
    },
    getAlbumDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: jfType._parameters.albumDetail,
        responses: {
            200: jfType._response.album,
            400: jfType._response.error,
        },
    },
    getAlbumList: {
        method: 'GET',
        path: 'users/:userId/items',
        query: jfType._parameters.albumList,
        responses: {
            200: jfType._response.albumList,
            400: jfType._response.error,
        },
    },
    getArtistList: {
        method: 'GET',
        path: 'artists',
        query: jfType._parameters.albumArtistList,
        responses: {
            200: jfType._response.albumArtistList,
            400: jfType._response.error,
        },
    },
    getGenreList: {
        method: 'GET',
        path: 'genres',
        query: jfType._parameters.genreList,
        responses: {
            200: jfType._response.genreList,
            400: jfType._response.error,
        },
    },
    getInstantMix: {
        method: 'GET',
        path: 'songs/:itemId/InstantMix',
        query: jfType._parameters.similarSongs,
        responses: {
            200: jfType._response.songList,
            400: jfType._response.error,
        },
    },
    getMusicFolderList: {
        method: 'GET',
        path: 'users/:userId/items',
        responses: {
            200: jfType._response.musicFolderList,
            400: jfType._response.error,
        },
    },
    getPlaylistDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        query: jfType._parameters.playlistDetail,
        responses: {
            200: jfType._response.playlist,
            400: jfType._response.error,
        },
    },
    getPlaylistList: {
        method: 'GET',
        path: 'users/:userId/items',
        query: jfType._parameters.playlistList,
        responses: {
            200: jfType._response.playlistList,
            400: jfType._response.error,
        },
    },
    getPlaylistSongList: {
        method: 'GET',
        path: 'playlists/:id/items',
        query: jfType._parameters.songList,
        responses: {
            200: jfType._response.playlistSongList,
            400: jfType._response.error,
        },
    },
    getServerInfo: {
        method: 'GET',
        path: 'system/info',
        responses: {
            200: jfType._response.serverInfo,
            400: jfType._response.error,
        },
    },
    getSimilarArtistList: {
        method: 'GET',
        path: 'artists/:id/similar',
        query: jfType._parameters.similarArtistList,
        responses: {
            200: jfType._response.albumArtistList,
            400: jfType._response.error,
        },
    },
    getSimilarSongs: {
        method: 'GET',
        path: 'items/:itemId/similar',
        query: jfType._parameters.similarSongs,
        responses: {
            200: jfType._response.similarSongs,
            400: jfType._response.error,
        },
    },
    getSongDetail: {
        method: 'GET',
        path: 'users/:userId/items/:id',
        responses: {
            200: jfType._response.song,
            400: jfType._response.error,
        },
    },
    getSongList: {
        method: 'GET',
        path: 'users/:userId/items',
        query: jfType._parameters.songList,
        responses: {
            200: jfType._response.songList,
            400: jfType._response.error,
        },
    },
    getSongLyrics: {
        method: 'GET',
        path: 'audio/:id/Lyrics',
        responses: {
            200: jfType._response.lyrics,
            404: jfType._response.error,
        },
    },
    getSyncPlayList: {
        method: 'GET',
        path: 'SyncPlay/List',
        responses: {
            200: jfType._response.syncPlayList,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    getTopSongsList: {
        method: 'GET',
        path: 'users/:userId/items',
        query: jfType._parameters.songList,
        responses: {
            200: jfType._response.topSongsList,
            400: jfType._response.error,
        },
    },
    postSyncPlayBuffering: {
        body: jfType._parameters.syncPlayBuffering,
        method: 'POST',
        path: 'SyncPlay/Buffering',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayJoin: {
        body: z.object({
            GroupId: z.string(),
        }),
        method: 'POST',
        path: 'SyncPlay/Join',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayLeave: {
        method: 'POST',
        path: 'SyncPlay/Leave',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayNew: {
        body: z.object({
            GroupName: z.string(),
        }),
        method: 'POST',
        path: 'SyncPlay/New',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayNextItem: {
        body: z.object({
            PlaylistItemId: z.string(),
        }),
        method: 'POST',
        path: 'SyncPlay/NextItem',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayPause: {
        method: 'POST',
        path: 'SyncPlay/Pause',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayPing: {
        body: z.object({
            Ping: z.number(),
        }),
        method: 'POST',
        path: 'SyncPlay/Ping',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayQueue: {
        body: z.object({
            ItemIds: z.array(z.string()),
            Mode: z.string(),
        }),
        method: 'POST',
        path: 'SyncPlay/Queue',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayReady: {
        body: jfType._parameters.syncPlayBuffering,
        method: 'POST',
        path: 'SyncPlay/Ready',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlaySeek: {
        body: z.object({
            PositionTicks: z.number(),
        }),
        method: 'POST',
        path: 'SyncPlay/Seek',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlaySetRepeatMode: {
        body: z.object({
            RepeatMode: z.string(),
        }),
        method: 'POST',
        path: 'SyncPlay/SetRepeatMode',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayStop: {
        method: 'POST',
        path: 'SyncPlay/Stop',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    postSyncPlayUnpause: {
        method: 'POST',
        path: 'SyncPlay/Unpause',
        responses: {
            204: null,
            401: jfType._response.error,
            403: jfType._response.error,
        },
    },
    removeFavorite: {
        body: jfType._parameters.favorite,
        method: 'DELETE',
        path: 'users/:userId/favoriteitems/:id',
        responses: {
            200: jfType._response.favorite,
            400: jfType._response.error,
        },
    },
    removeFromPlaylist: {
        body: null,
        method: 'DELETE',
        path: 'playlists/:id/items',
        query: jfType._parameters.removeFromPlaylist,
        responses: {
            200: jfType._response.removeFromPlaylist,
            400: jfType._response.error,
        },
    },
    scrobblePlaying: {
        body: jfType._parameters.scrobble,
        method: 'POST',
        path: 'sessions/playing',
        responses: {
            200: jfType._response.scrobble,
            400: jfType._response.error,
        },
    },
    scrobbleProgress: {
        body: jfType._parameters.scrobble,
        method: 'POST',
        path: 'sessions/playing/progress',
        responses: {
            200: jfType._response.scrobble,
            400: jfType._response.error,
        },
    },
    scrobbleStopped: {
        body: jfType._parameters.scrobble,
        method: 'POST',
        path: 'sessions/playing/stopped',
        responses: {
            200: jfType._response.scrobble,
            400: jfType._response.error,
        },
    },
    search: {
        method: 'GET',
        path: 'users/:userId/items',
        query: jfType._parameters.search,
        responses: {
            200: jfType._response.search,
            400: jfType._response.error,
        },
    },
    updatePlaylist: {
        body: jfType._parameters.updatePlaylist,
        method: 'PUT',
        path: 'items/:id',
        responses: {
            200: jfType._response.updatePlaylist,
            400: jfType._response.error,
        },
    },
});

let axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
};

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const currentServer = useAuthStore.getState().currentServer;

            if (currentServer) {
                useAuthStore
                    .getState()
                    .actions.updateServer(currentServer.id, { credential: undefined });
            }

            authenticationFailure(currentServer);
        }

        return Promise.reject(error);
    },
);

const parsePath = (fullPath: string) => {
    const [path, params] = fullPath.split('?');

    const parsedParams = qs.parse(params);
    const notNilParams = omitBy(parsedParams, (value) => value === 'undefined' || value === 'null');

    return {
        params: notNilParams,
        path,
    };
};

export const jfApiClient = (args: {
    server: ServerListItem | null;
    signal?: AbortSignal;
    url?: string;
}) => {
    const { server, url, signal } = args;

    return initClient(contract, {
        api: async ({ path, method, headers, body }) => {
            let baseUrl: string | undefined;
            let token: string | undefined;

            const { params, path: api } = parsePath(path);

            if (server) {
                baseUrl = `${server?.url}`;
                token = server?.credential;
            } else {
                baseUrl = url;
            }

            try {
                let result;
                let errorOccurred;

                do {
                    errorOccurred = false;
                    try {
                        result = await axiosClient.request({
                            data: body,
                            headers: {
                                ...headers,
                                ...(token && { 'X-MediaBrowser-Token': token }),
                            },
                            method: method as Method,
                            params,
                            signal,
                            url: `${baseUrl}/${api}`,
                        });
                    } catch (error) {
                        // rebuild axiosClient
                        axiosClient = axios.create({});
                        errorOccurred = true;
                        // eslint-disable-next-line no-promise-executor-return
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                } while (errorOccurred);

                if (!result) {
                    throw new Error(
                        i18n.t('error.networkError', {
                            postProcess: 'sentenceCase',
                        }) as string,
                    );
                }

                return {
                    body: result.data,
                    headers: result.headers as any,
                    status: result.status,
                };
            } catch (e: Error | AxiosError | any) {
                if (isAxiosError(e)) {
                    if (e.code === 'ERR_NETWORK') {
                        throw new Error(
                            i18n.t('error.networkError', {
                                postProcess: 'sentenceCase',
                            }) as string,
                        );
                    }

                    const error = e as AxiosError;
                    const response = error.response as AxiosResponse;
                    return {
                        body: response?.data,
                        headers: response?.headers as any,
                        status: response.status,
                    };
                }
                throw e;
            }
        },
        baseHeaders: {
            'Content-Type': 'application/json',
        },
        baseUrl: '',
        jsonQuery: false,
    });
};
