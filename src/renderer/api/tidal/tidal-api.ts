// Tidal Developer API: https://developer.tidal.com/apiref
// Create an account and register an app to get a clientId and clientSecret: https://developer.tidal.com/dashboard/

import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosResponse, Method, isAxiosError } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import i18n from '/@/i18n/i18n';
import { tidalType } from '/@/renderer/api/tidal/tidal-types';
import { resultWithHeaders } from '/@/renderer/api/utils';
import { z } from 'zod';

const c = initContract();

const authContract = c.router({
    authenticate: {
        body: tidalType._parameters.authenticate,
        headers: z.object({
            Authorization: z.string(),
            'Content-Type': z.string(),
        }),
        method: 'POST',
        path: '',
        responses: {
            200: resultWithHeaders(tidalType._response.authenticate),
            400: resultWithHeaders(tidalType._response.authenticate400Error),
        },
    },
});

const albumContract = c.router({
    getAlbumByBarcodeId: {
        method: 'GET',
        path: '/albums/byBarcodeId',
        query: tidalType._parameters.getAlbumByBarcodeId,
        responses: {
            207: resultWithHeaders(tidalType._response.getAlbumByBarcodeId),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getAlbumById: {
        method: 'GET',
        path: '/albums/:id',
        query: tidalType._parameters.getAlbumById,
        responses: {
            207: resultWithHeaders(tidalType._response.getAlbumById),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            451: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getAlbumItems: {
        method: 'GET',
        path: '/albums/:id/items',
        responses: {
            207: resultWithHeaders(tidalType._response.getAlbumItems),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getAlbumsByArtistId: {
        method: 'GET',
        path: '/artists/:id/albums',
        responses: {
            207: resultWithHeaders(tidalType._response.getAlbumsByArtistId),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getAlbumsByIds: {
        method: 'GET',
        path: '/albums/byIds',
        responses: {
            207: resultWithHeaders(tidalType._response.getAlbumsByIds),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getSimilarAlbums: {
        method: 'GET',
        path: '/albums/:id/similar',
        responses: {
            207: resultWithHeaders(tidalType._response.getSimilarAlbums),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
});

const artistContract = c.router({
    getArtistById: {
        method: 'GET',
        path: '/artists/:id',
        responses: {
            207: resultWithHeaders(tidalType._response.getArtistById),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            451: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getArtistsByIds: {
        method: 'GET',
        path: '/artists',
        responses: {
            207: resultWithHeaders(tidalType._response.getArtistsByIds),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getSimilarArtists: {
        method: 'GET',
        path: '/artists/:id/similar',
        responses: {
            207: resultWithHeaders(tidalType._response.getSimilarArtists),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
});

const trackContract = c.router({
    getSimilarTracks: {
        method: 'GET',
        path: '/tracks/:id/similar',
        responses: {
            207: resultWithHeaders(tidalType._response.getSimilarTracks),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            451: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getTrackById: {
        method: 'GET',
        path: '/tracks/:id',
        responses: {
            207: resultWithHeaders(tidalType._response.getTrackById),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            451: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
    getTracksByIds: {
        method: 'GET',
        path: '/tracks',
        responses: {
            207: resultWithHeaders(tidalType._response.getTracksByIds),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            451: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
});

const searchContract = c.router({
    search: {
        method: 'GET',
        path: '/search',
        query: tidalType._parameters.search,
        responses: {
            207: resultWithHeaders(tidalType._response.search),
            400: resultWithHeaders(tidalType._response.error),
            404: resultWithHeaders(tidalType._response.error),
            405: resultWithHeaders(tidalType._response.error),
            406: resultWithHeaders(tidalType._response.error),
            415: resultWithHeaders(tidalType._response.error),
            500: resultWithHeaders(tidalType._response.error),
        },
    },
});

export const tidalContract = c.router({
    album: albumContract,
    artist: artistContract,
    authenticate: authContract.authenticate,
    search: searchContract.search,
    track: trackContract,
});

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
};

const parsePath = (fullPath: string) => {
    const [path, params] = fullPath.split('?');

    const parsedParams = qs.parse(params);

    // Convert indexed object to array
    const newParams: Record<string, any> = {};
    Object.keys(parsedParams).forEach((key) => {
        const isIndexedArrayObject =
            typeof parsedParams[key] === 'object' &&
            Object.keys(parsedParams[key] || {}).includes('0');

        if (!isIndexedArrayObject) {
            newParams[key] = parsedParams[key];
        } else {
            newParams[key] = Object.values(parsedParams[key] || {});
        }
    });

    const notNilParams = omitBy(newParams, (value) => value === 'undefined' || value === 'null');

    return {
        params: notNilParams,
        path,
    };
};

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export const tidalApiClient = (args: { signal?: AbortSignal; url?: string }) => {
    const { url, signal } = args;

    return initClient(tidalContract, {
        api: async ({ path, method, headers, body, rawBody }) => {
            let baseUrl: string | undefined = 'https://openapi.tidal.com';
            let token: string | undefined;

            const { params, path: api } = parsePath(path);

            if (url !== undefined) {
                baseUrl = url;
            }

            // Authentication requires using the raw body
            const useBody = headers['content-type'] !== 'application/x-www-form-urlencoded';

            try {
                const result = await axiosClient.request({
                    data: useBody ? body : rawBody,
                    headers: {
                        'Content-Type': 'application/vnd.tidal.v1+json',
                        ...headers,
                        ...(token && { Authorization: `Basic ${token}` }),
                    },
                    method: method as Method,
                    params,
                    signal,
                    url: `${baseUrl}/${api}`,
                });
                return {
                    body: { data: result.data, headers: result.headers },
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
                        body: { data: response?.data, headers: response?.headers },
                        headers: response?.headers as any,
                        status: response?.status,
                    };
                }
                throw e;
            }
        },
        baseHeaders: {},
        baseUrl: '',
        jsonQuery: false,
    });
};
