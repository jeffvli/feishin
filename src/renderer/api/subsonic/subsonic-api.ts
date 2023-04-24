import { initClient, initContract } from '@ts-rest/core';
import axios, { Method, AxiosError, isAxiosError, AxiosResponse } from 'axios';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';
import { toast } from '/@/renderer/components';
import { useAuthStore } from '/@/renderer/store';

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
  getArtistInfo: {
    method: 'GET',
    path: 'getArtistInfo.view',
    query: ssType._parameters.artistInfo,
    responses: {
      200: ssType._response.artistInfo,
    },
  },
  getMusicFolderList: {
    method: 'GET',
    path: 'getMusicFolders.view',
    responses: {
      200: ssType._response.musicFolderList,
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
  setRating: {
    method: 'GET',
    path: 'setRating.view',
    query: ssType._parameters.setRating,
    responses: {
      200: ssType._response.setRating,
    },
  },
});

const axiosClient = axios.create({});

axiosClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    if (data['subsonic-response'].status !== 'ok') {
      // Suppress code related to non-linked lastfm or spotify from Navidrome
      if (data['subsonic-response'].error.code !== 0) {
        toast.error({
          message: data['subsonic-response'].error.message,
          title: 'Issue from Subsonic API',
        });
      }
    }

    return data['subsonic-response'];
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const ssApiClient = (args: { serverId?: string; signal?: AbortSignal; url?: string }) => {
  const { serverId, url, signal } = args;

  return initClient(contract, {
    api: async ({ path, method, headers, body }) => {
      let baseUrl: string | undefined;
      const authParams: Record<string, any> = {};

      if (serverId) {
        const selectedServer = useAuthStore.getState().actions.getServer(serverId);

        if (!selectedServer) {
          return {
            body: { data: null, headers: null },
            status: 500,
          };
        }

        baseUrl = `${selectedServer?.url}/rest`;
        const token = selectedServer.credential;
        const params = token.split(/&?\w=/gm);

        authParams.u = selectedServer.username;
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
          },
          signal,
          url: `${baseUrl}/${path}`,
        });
        return {
          body: { data: result.data, headers: result.headers },
          status: result.status,
        };
      } catch (e: Error | AxiosError | any) {
        if (isAxiosError(e)) {
          const error = e as AxiosError;
          const response = error.response as AxiosResponse;
          return {
            body: { data: response.data, headers: response.headers },
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
  });
};
