import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosResponse, Method, isAxiosError } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import i18n from '/@/i18n/i18n';
import { SubsonicApi } from '/@/renderer/api/subsonic/subsonic-types';
import { ServerListItem } from '/@/renderer/api/types';
import { toast } from '/@/renderer/components/toast/index';

const c = initContract();

export const contract = c.router({
    changePassword: {
        method: 'GET',
        path: 'changePassword.view',
        query: SubsonicApi.changePassword.parameters,
        responses: {
            200: SubsonicApi.changePassword.response,
        },
    },
    createInternetRadioStation: {
        method: 'GET',
        path: 'createInternetRadioStation.view',
        query: SubsonicApi.createInternetRadioStation.parameters,
        responses: {
            200: SubsonicApi.createInternetRadioStation.response,
        },
    },
    createPlaylist: {
        method: 'GET',
        path: 'createPlaylist.view',
        query: SubsonicApi.createPlaylist.parameters,
        responses: {
            200: SubsonicApi.createPlaylist.response,
        },
    },
    createShare: {
        method: 'GET',
        path: 'createShare.view',
        query: SubsonicApi.createShare.parameters,
        responses: {
            200: SubsonicApi.createShare.response,
        },
    },
    createUser: {
        method: 'GET',
        path: 'createUser.view',
        query: SubsonicApi.createUser.parameters,
        responses: {
            200: SubsonicApi.createUser.response,
        },
    },
    deleteInternetRadioStation: {
        method: 'GET',
        path: 'deleteInternetRadioStation.view',
        query: SubsonicApi.deleteInternetRadioStation.parameters,
        responses: {
            200: SubsonicApi.deleteInternetRadioStation.response,
        },
    },
    deletePlaylist: {
        method: 'GET',
        path: 'deletePlaylist.view',
        query: SubsonicApi.deletePlaylist.parameters,
        responses: {
            200: SubsonicApi.deletePlaylist.response,
        },
    },
    deleteShare: {
        method: 'GET',
        path: 'deleteShare.view',
        query: SubsonicApi.deleteShare.parameters,
        responses: {
            200: SubsonicApi.deleteShare.response,
        },
    },
    deleteUser: {
        method: 'GET',
        path: 'deleteUser.view',
        query: SubsonicApi.deleteUser.parameters,
        responses: {
            200: SubsonicApi.deleteUser.response,
        },
    },
    getAlbum: {
        method: 'GET',
        path: 'getAlbum.view',
        query: SubsonicApi.getAlbum.parameters,
        responses: {
            200: SubsonicApi.getAlbum.response,
        },
    },
    getAlbumInfo: {
        method: 'GET',
        path: 'getAlbumInfo.view',
        query: SubsonicApi.getAlbumInfo.parameters,
        responses: {
            200: SubsonicApi.getAlbumInfo.response,
        },
    },
    getAlbumInfo2: {
        method: 'GET',
        path: 'getAlbumInfo2.view',
        query: SubsonicApi.getAlbumInfo2.parameters,
        responses: {
            200: SubsonicApi.getAlbumInfo2.response,
        },
    },
    getAlbumList: {
        method: 'GET',
        path: 'getAlbumList.view',
        query: SubsonicApi.getAlbumList.parameters,
        responses: {
            200: SubsonicApi.getAlbumList.response,
        },
    },
    getAlbumList2: {
        method: 'GET',
        path: 'getAlbumList2.view',
        query: SubsonicApi.getAlbumList2.parameters,
        responses: {
            200: SubsonicApi.getAlbumList2.response,
        },
    },
    getArtist: {
        method: 'GET',
        path: 'getArtist.view',
        query: SubsonicApi.getArtist.parameters,
        responses: {
            200: SubsonicApi.getArtist.response,
        },
    },
    getArtistInfo: {
        method: 'GET',
        path: 'getArtistInfo.view',
        query: SubsonicApi.getArtistInfo.parameters,
        responses: {
            200: SubsonicApi.getArtistInfo.response,
        },
    },
    getArtistInfo2: {
        method: 'GET',
        path: 'getArtistInfo2.view',
        query: SubsonicApi.getArtistInfo2.parameters,
        responses: {
            200: SubsonicApi.getArtistInfo2.response,
        },
    },
    getArtists: {
        method: 'GET',
        path: 'getArtists.view',
        query: SubsonicApi.getArtists.parameters,
        responses: {
            200: SubsonicApi.getArtists.response,
        },
    },
    getGenres: {
        method: 'GET',
        path: 'getGenres.view',
        query: SubsonicApi.getGenres.parameters,
        responses: {
            200: SubsonicApi.getGenres.response,
        },
    },
    getIndexes: {
        method: 'GET',
        path: 'getIndexes.view',
        query: SubsonicApi.getIndexes.parameters,
        responses: {
            200: SubsonicApi.getIndexes.response,
        },
    },
    getInternetRadioStations: {
        method: 'GET',
        path: 'getInternetRadioStations.view',
        query: SubsonicApi.getInternetRadioStations.parameters,
        responses: {
            200: SubsonicApi.getInternetRadioStations.response,
        },
    },
    getLicense: {
        method: 'GET',
        path: 'getLicense.view',
        query: SubsonicApi.getLicense.parameters,
        responses: {
            200: SubsonicApi.getLicense.response,
        },
    },
    getLyrics: {
        method: 'GET',
        path: 'getLyrics.view',
        query: SubsonicApi.getLyrics.parameters,
        responses: {
            200: SubsonicApi.getLyrics.response,
        },
    },
    getMusicDirectory: {
        method: 'GET',
        path: 'getMusicDirectory.view',
        query: SubsonicApi.getMusicDirectory.parameters,
        responses: {
            200: SubsonicApi.getMusicDirectory.response,
        },
    },
    getMusicFolders: {
        method: 'GET',
        path: 'getMusicFolders.view',
        responses: {
            200: SubsonicApi.getMusicFolders.response,
        },
    },
    getNowPlaying: {
        method: 'GET',
        path: 'getNowPlaying.view',
        query: SubsonicApi.getNowPlaying.parameters,
        responses: {
            200: SubsonicApi.getNowPlaying.response,
        },
    },
    getOpenSubsonicExtensions: {
        method: 'GET',
        path: 'getOpenSubsonicExtensions.view',
        query: SubsonicApi.getOpenSubsonicExtensions.parameters,
        responses: {
            200: SubsonicApi.getOpenSubsonicExtensions.response,
        },
    },
    getPlaylist: {
        method: 'GET',
        path: 'getPlaylist.view',
        query: SubsonicApi.getPlaylist.parameters,
        responses: {
            200: SubsonicApi.getPlaylist.response,
        },
    },
    getPlaylists: {
        method: 'GET',
        path: 'getPlaylists.view',
        query: SubsonicApi.getPlaylists.parameters,
        responses: {
            200: SubsonicApi.getPlaylists.response,
        },
    },
    getRandomSongs: {
        method: 'GET',
        path: 'getRandomSongs.view',
        query: SubsonicApi.getRandomSongs.parameters,
        responses: {
            200: SubsonicApi.getRandomSongs.response,
        },
    },
    getScanStatus: {
        method: 'GET',
        path: 'getScanStatus.view',
        responses: {
            200: SubsonicApi.getScanStatus.response,
        },
    },
    getShares: {
        method: 'GET',
        path: 'getShares.view',
        query: SubsonicApi.getShares.parameters,
        responses: {
            200: SubsonicApi.getShares.response,
        },
    },
    getSimilarSongs: {
        method: 'GET',
        path: 'getSimilarSongs.view',
        query: SubsonicApi.getSimilarSongs.parameters,
        responses: {
            200: SubsonicApi.getSimilarSongs.response,
        },
    },
    getSimilarSongs2: {
        method: 'GET',
        path: 'getSimilarSongs2.view',
        query: SubsonicApi.getSimilarSongs2.parameters,
        responses: {
            200: SubsonicApi.getSimilarSongs2.response,
        },
    },
    getSong: {
        method: 'GET',
        path: 'getSong.view',
        query: SubsonicApi.getSong.parameters,
        responses: {
            200: SubsonicApi.getSong.response,
        },
    },
    getSongsByGenre: {
        method: 'GET',
        path: 'getSongsByGenre.view',
        query: SubsonicApi.getSongsByGenre.parameters,
        responses: {
            200: SubsonicApi.getSongsByGenre.response,
        },
    },
    getStarred: {
        method: 'GET',
        path: 'getStarred.view',
        query: SubsonicApi.getStarred.parameters,
        responses: {
            200: SubsonicApi.getStarred.response,
        },
    },
    getStarred2: {
        method: 'GET',
        path: 'getStarred2.view',
        query: SubsonicApi.getStarred2.parameters,
        responses: {
            200: SubsonicApi.getStarred2.response,
        },
    },
    getTopSongs: {
        method: 'GET',
        path: 'getTopSongs.view',
        query: SubsonicApi.getTopSongs.parameters,
        responses: {
            200: SubsonicApi.getTopSongs.response,
        },
    },
    getUser: {
        method: 'GET',
        path: 'getUser.view',
        query: SubsonicApi.getUser.parameters,
        responses: {
            200: SubsonicApi.getUser.response,
        },
    },
    getUsers: {
        method: 'GET',
        path: 'getUsers.view',
        query: SubsonicApi.getUsers.parameters,
        responses: {
            200: SubsonicApi.getUsers.response,
        },
    },
    ping: {
        method: 'GET',
        path: 'ping.view',
        query: SubsonicApi.ping.parameters,
        responses: {
            200: SubsonicApi.ping.response,
        },
    },
    scrobble: {
        method: 'GET',
        path: 'scrobble.view',
        query: SubsonicApi.scrobble.parameters,
        responses: {
            200: SubsonicApi.scrobble.response,
        },
    },
    search3: {
        method: 'GET',
        path: 'search3.view',
        query: SubsonicApi.search3.parameters,
        responses: {
            200: SubsonicApi.search3.response,
        },
    },
    setRating: {
        method: 'GET',
        path: 'setRating.view',
        query: SubsonicApi.setRating.parameters,
        responses: {
            200: SubsonicApi.setRating.response,
        },
    },
    star: {
        method: 'GET',
        path: 'star.view',
        query: SubsonicApi.star.parameters,
        responses: {
            200: SubsonicApi.star.response,
        },
    },
    startScan: {
        method: 'GET',
        path: 'startScan.view',
        responses: {
            200: SubsonicApi.startScan.response,
        },
    },
    unstar: {
        method: 'GET',
        path: 'unstar.view',
        query: SubsonicApi.unstar.parameters,
        responses: {
            200: SubsonicApi.unstar.response,
        },
    },
    updateInternetRadioStation: {
        method: 'GET',
        path: 'updateInternetRadioStation.view',
        query: SubsonicApi.updateInternetRadioStation.parameters,
        responses: {
            200: SubsonicApi.updateInternetRadioStation.response,
        },
    },
    updatePlaylist: {
        method: 'GET',
        path: 'updatePlaylist.view',
        query: SubsonicApi.updatePlaylist.parameters,
        responses: {
            200: SubsonicApi.updatePlaylist.response,
        },
    },
    updateShare: {
        method: 'GET',
        path: 'updateShare.view',
        query: SubsonicApi.updateShare.parameters,
        responses: {
            200: SubsonicApi.updateShare.response,
        },
    },
    updateUser: {
        method: 'GET',
        path: 'updateUser.view',
        query: SubsonicApi.updateUser.parameters,
        responses: {
            200: SubsonicApi.updateUser.response,
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

        // Ping endpoint returns a string
        if (typeof data === 'string') {
            return response;
        }

        if (data['subsonic-response']?.status !== 'ok') {
            // Suppress code related to non-linked lastfm or spotify from Navidrome
            if (data['subsonic-response']?.error.code !== 0) {
                toast.error({
                    message: data['subsonic-response']?.error.message,
                    title: i18n.t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                });
            }

            return Promise.reject(data['subsonic-response']?.error);
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

export const subsonicApiClient = (args: {
    server: ServerListItem | null;
    signal?: AbortSignal;
    url?: string;
}) => {
    const { server, url, signal } = args;

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
                const result = await axiosClient.request({
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
                    url: `${baseUrl}/${api}`,
                });

                return {
                    body: result?.data,
                    headers: result?.headers as any,
                    status: result?.status,
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
                        headers: response.headers as any,
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
