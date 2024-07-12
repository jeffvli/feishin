import { initClient, initContract } from '@ts-rest/core';
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import { iderType } from './ider-types';
import { resultWithHeaders } from '/@/renderer/api/utils';
import { ServerListItem } from '/@/renderer/api/types';
import i18n from '/@/i18n/i18n';

const c = initContract();

export const contract = c.router({
    getTrackList: {
        method: 'GET',
        path: 'get_segments',
        query: iderType._parameters.trackList,
        responses: {
            200: resultWithHeaders(iderType._response.trackList),
            500: resultWithHeaders(iderType._response.error),
        },
    },
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

const shouldDelay = false;

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 5;

const waitForResult = async (count = 0): Promise<void> => {
    return new Promise((resolve) => {
        if (count === MAX_RETRIES || !shouldDelay) resolve();

        setTimeout(() => {
            waitForResult(count + 1)
                .then(resolve)
                .catch(resolve);
        }, RETRY_DELAY_MS);
    });
};

export const iderApiClient = (args: {
    server: ServerListItem | null;
    signal?: AbortSignal;
    url?: string;
}) => {
    const { server, url, signal } = args;

    return initClient(contract, {
        api: async ({ path, method, body }) => {
            let baseUrl: string | undefined;

            const { params, path: api } = parsePath(path);

            if (server) {
                baseUrl = `${server?.url}/api`;
            } else {
                baseUrl = url;
            }

            try {
                if (shouldDelay) await waitForResult();

                const result = await axiosClient.request({
                    data: body,
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
        baseHeaders: {
            'Content-Type': 'application/json',
        },
        baseUrl: '',
        jsonQuery: false,
    });
};
