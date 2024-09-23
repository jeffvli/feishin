import { initClient, initContract } from '@ts-rest/core';
import axios, { Method, AxiosError, isAxiosError, AxiosResponse } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import { z } from 'zod';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';
import { ServerListItem } from '/@/renderer/api/types';
import { toast } from '/@/renderer/components/toast/index';
import i18n from '/@/i18n/i18n';

const c = initContract();

export const contract = c.router({
    authenticate: {
        method: 'GET',
        path: 'ping.view',
        query: ssType._parameters.authenticate,
        responses: {
            200: ssType._response.authenticate,
        },
    },
    createFavorite: {
        method: 'GET',
        path: 'star.view',
        query: ssType._parameters.createFavorite,
        responses: {
            200: ssType._response.createFavorite,
        },
    },
    createPlaylist: {
        method: 'GET',
        path: 'createPlaylist.view',
        query: ssType._parameters.createPlaylist,
        responses: {
            200: ssType._response.createPlaylist,
        },
    },
    deletePlaylist: {
        method: 'GET',
        path: 'deletePlaylist.view',
        query: ssType._parameters.deletePlaylist,
        responses: {
            200: ssType._response.baseResponse,
        },
    },
    getAlbum: {
        method: 'GET',
        path: 'getAlbum.view',
        query: ssType._parameters.getAlbum,
        responses: {
            200: ssType._response.getAlbum,
        },
    },
    getAlbumList2: {
        method: 'GET',
        path: 'getAlbumList2.view',
        query: ssType._parameters.getAlbumList2,
        responses: {
            200: ssType._response.getAlbumList2,
        },
    },
    getArtist: {
        method: 'GET',
        path: 'getArtist.view',
        query: ssType._parameters.getArtist,
        responses: {
            200: ssType._response.getArtist,
        },
    },
    getArtistInfo: {
        method: 'GET',
        path: 'getArtistInfo.view',
        query: ssType._parameters.artistInfo,
        responses: {
            200: ssType._response.artistInfo,
        },
    },
    getArtists: {
        method: 'GET',
        path: 'getArtists.view',
        query: ssType._parameters.getArtists,
        responses: {
            200: ssType._response.getArtists,
        },
    },
    getGenres: {
        method: 'GET',
        path: 'getGenres.view',
        query: ssType._parameters.getGenres,
        responses: {
            200: ssType._response.getGenres,
        },
    },
    getMusicFolderList: {
        method: 'GET',
        path: 'getMusicFolders.view',
        responses: {
            200: ssType._response.musicFolderList,
        },
    },
    getPlaylist: {
        method: 'GET',
        path: 'getPlaylist.view',
        query: ssType._parameters.getPlaylist,
        responses: {
            200: ssType._response.getPlaylist,
        },
    },
    getPlaylists: {
        method: 'GET',
        path: 'getPlaylists.view',
        query: ssType._parameters.getPlaylists,
        responses: {
            200: ssType._response.getPlaylists,
        },
    },
    getRandomSongList: {
        method: 'GET',
        path: 'getRandomSongs.view',
        query: ssType._parameters.randomSongList,
        responses: {
            200: ssType._response.randomSongList,
        },
    },
    getServerInfo: {
        method: 'GET',
        path: 'getOpenSubsonicExtensions.view',
        responses: {
            200: ssType._response.serverInfo,
        },
    },
    getSimilarSongs: {
        method: 'GET',
        path: 'getSimilarSongs',
        query: ssType._parameters.similarSongs,
        responses: {
            200: ssType._response.similarSongs,
        },
    },
    getSong: {
        method: 'GET',
        path: 'getSong.view',
        query: ssType._parameters.getSong,
        responses: {
            200: ssType._response.getSong,
        },
    },
    getSongsByGenre: {
        method: 'GET',
        path: 'getSongsByGenre.view',
        query: ssType._parameters.getSongsByGenre,
        responses: {
            200: ssType._response.getSongsByGenre,
        },
    },
    getStarred: {
        method: 'GET',
        path: 'getStarred.view',
        query: ssType._parameters.getStarred,
        responses: {
            200: ssType._response.getStarred,
        },
    },
    getStructuredLyrics: {
        method: 'GET',
        path: 'getLyricsBySongId.view',
        query: ssType._parameters.structuredLyrics,
        responses: {
            200: ssType._response.structuredLyrics,
        },
    },
    getTopSongsList: {
        method: 'GET',
        path: 'getTopSongs.view',
        query: ssType._parameters.topSongsList,
        responses: {
            200: ssType._response.topSongsList,
        },
    },
    ping: {
        method: 'GET',
        path: 'ping.view',
        responses: {
            200: ssType._response.ping,
        },
    },
    removeFavorite: {
        method: 'GET',
        path: 'unstar.view',
        query: ssType._parameters.removeFavorite,
        responses: {
            200: ssType._response.removeFavorite,
        },
    },
    scrobble: {
        method: 'GET',
        path: 'scrobble.view',
        query: ssType._parameters.scrobble,
        responses: {
            200: ssType._response.scrobble,
        },
    },
    search3: {
        method: 'GET',
        path: 'search3.view',
        query: ssType._parameters.search3,
        responses: {
            200: ssType._response.search3,
        },
    },
    setRating: {
        method: 'GET',
        path: 'setRating.view',
        query: ssType._parameters.setRating,
        responses: {
            200: ssType._response.setRating,
        },
    },
    updatePlaylist: {
        method: 'GET',
        path: 'updatePlaylist.view',
        query: ssType._parameters.updatePlaylist,
        responses: {
            200: ssType._response.baseResponse,
        },
    },
});

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
};

axiosClient.interceptors.response.use(
    (response) => {
        const data = response.data;
        if (data['subsonic-response'].status !== 'ok') {
            // Suppress code related to non-linked lastfm or spotify from Navidrome
            if (data['subsonic-response'].error.code !== 0) {
                toast.error({
                    message: data['subsonic-response'].error.message,
                    title: i18n.t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                });
            }
        }

        return response;
    },
    (error) => {
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

const silentlyTransformResponse = (data: any) => {
    const jsonBody = JSON.parse(data);
    const status = jsonBody ? jsonBody['subsonic-response']?.status : undefined;

    if (status && status !== 'ok') {
        jsonBody['subsonic-response'].error.code = 0;
    }

    return jsonBody;
};

export const ssApiClient = (args: {
    server: ServerListItem | null;
    signal?: AbortSignal;
    silent?: boolean;
    url?: string;
}) => {
    const { server, url, signal, silent } = args;

    return initClient(contract, {
        api: async ({ path, method, headers, body }) => {
            let baseUrl: string | undefined;
            const authParams: Record<string, any> = {};

            const { params, path: api } = parsePath(path);

            if (server) {
                baseUrl = `${server.url}/rest`;
                const token = server.credential;
                const params = token.split(/&?\w=/gm);

                authParams.u = server.username;
                if (params?.length === 4) {
                    authParams.s = params[2];
                    authParams.t = params[3];
                } else if (params?.length === 3) {
                    authParams.p = params[2];
                }
            } else {
                baseUrl = url;
            }

            try {
                const result = await axiosClient.request<
                    z.infer<typeof ssType._response.baseResponse>
                >({
                    data: body,
                    headers,
                    method: method as Method,
                    params: {
                        c: 'Feishin',
                        f: 'json',
                        v: '1.13.0',
                        ...authParams,
                        ...params,
                    },
                    signal,
                    // In cases where we have a fallback, don't notify the error
                    transformResponse: silent ? silentlyTransformResponse : undefined,
                    url: `${baseUrl}/${api}`,
                });

                return {
                    body: result.data['subsonic-response'],
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
                        status: response?.status,
                    };
                }
                throw e;
            }
        },
        baseHeaders: {
            'Content-Type': 'application/json',
        },
        baseUrl: '',
    });
};
