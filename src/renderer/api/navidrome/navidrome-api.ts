import { initClient, initContract } from '@ts-rest/core';
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios';
import omitBy from 'lodash/omitBy';
import qs from 'qs';
import { ndType } from './navidrome-types';
import { resultWithHeaders } from '/@/renderer/api/utils';
import { toast } from '/@/renderer/components/toast/index';
import { useAuthStore } from '/@/renderer/store';
import { ServerListItem } from '/@/renderer/types';

const c = initContract();

export const contract = c.router({
  addToPlaylist: {
    body: ndType._parameters.addToPlaylist,
    method: 'POST',
    path: 'playlist/:id/tracks',
    responses: {
      200: resultWithHeaders(ndType._response.addToPlaylist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  authenticate: {
    body: ndType._parameters.authenticate,
    method: 'POST',
    path: 'auth/login',
    responses: {
      200: resultWithHeaders(ndType._response.authenticate),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  createPlaylist: {
    body: ndType._parameters.createPlaylist,
    method: 'POST',
    path: 'playlist',
    responses: {
      200: resultWithHeaders(ndType._response.createPlaylist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  deletePlaylist: {
    body: null,
    method: 'DELETE',
    path: 'playlist/:id',
    responses: {
      200: resultWithHeaders(ndType._response.deletePlaylist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getAlbumArtistDetail: {
    method: 'GET',
    path: 'artist/:id',
    responses: {
      200: resultWithHeaders(ndType._response.albumArtist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getAlbumArtistList: {
    method: 'GET',
    path: 'artist',
    query: ndType._parameters.albumArtistList,
    responses: {
      200: resultWithHeaders(ndType._response.albumArtistList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getAlbumDetail: {
    method: 'GET',
    path: 'album/:id',
    responses: {
      200: resultWithHeaders(ndType._response.album),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getAlbumList: {
    method: 'GET',
    path: 'album',
    query: ndType._parameters.albumList,
    responses: {
      200: resultWithHeaders(ndType._response.albumList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getGenreList: {
    method: 'GET',
    path: 'genre',
    responses: {
      200: resultWithHeaders(ndType._response.genreList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getPlaylistDetail: {
    method: 'GET',
    path: 'playlist/:id',
    responses: {
      200: resultWithHeaders(ndType._response.playlist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getPlaylistList: {
    method: 'GET',
    path: 'playlist',
    query: ndType._parameters.playlistList,
    responses: {
      200: resultWithHeaders(ndType._response.playlistList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getPlaylistSongList: {
    method: 'GET',
    path: 'playlist/:id/tracks',
    query: ndType._parameters.songList,
    responses: {
      200: resultWithHeaders(ndType._response.playlistSongList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getSongDetail: {
    method: 'GET',
    path: 'song/:id',
    responses: {
      200: resultWithHeaders(ndType._response.song),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getSongList: {
    method: 'GET',
    path: 'song',
    query: ndType._parameters.songList,
    responses: {
      200: resultWithHeaders(ndType._response.songList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  getUserList: {
    method: 'GET',
    path: 'user',
    query: ndType._parameters.userList,
    responses: {
      200: resultWithHeaders(ndType._response.userList),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  removeFromPlaylist: {
    body: null,
    method: 'DELETE',
    path: 'playlist/:id/tracks',
    query: ndType._parameters.removeFromPlaylist,
    responses: {
      200: resultWithHeaders(ndType._response.removeFromPlaylist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
  updatePlaylist: {
    body: ndType._parameters.updatePlaylist,
    method: 'PUT',
    path: 'playlist/:id',
    responses: {
      200: resultWithHeaders(ndType._response.updatePlaylist),
      500: resultWithHeaders(ndType._response.error),
    },
  },
});

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
  return qs.stringify(params, { arrayFormat: 'repeat' });
};

axiosClient.interceptors.response.use(
  (response) => {
    const serverId = useAuthStore.getState().currentServer?.id;

    if (serverId) {
      const headerCredential = response.headers['x-nd-authorization'] as string | undefined;

      if (headerCredential) {
        useAuthStore.getState().actions.updateServer(serverId, {
          ndCredential: headerCredential,
        });
      }
    }

    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      toast.error({
        message: 'Your session has expired.',
      });

      const currentServer = useAuthStore.getState().currentServer;

      if (currentServer) {
        const serverId = currentServer.id;
        const token = currentServer.ndCredential;
        console.log(`token is expired: ${token}`);
        useAuthStore.getState().actions.updateServer(serverId, { ndCredential: undefined });
        useAuthStore.getState().actions.setCurrentServer(null);
      }
    }

    return Promise.reject(error);
  },
);

const parsePath = (fullPath: string) => {
  const [path, params] = fullPath.split('?');

  const parsedParams = qs.parse(params);

  // Convert indexed object to array
  const newParams: Record<string, any> = {};
  Object.keys(parsedParams).forEach((key) => {
    const isIndexedArrayObject =
      typeof parsedParams[key] === 'object' && Object.keys(parsedParams[key] || {}).includes('0');

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

export const ndApiClient = (args: {
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
        baseUrl = `${server?.url}/api`;
        token = server?.ndCredential;
      } else {
        baseUrl = url;
      }

      try {
        const result = await axiosClient.request({
          data: body,
          headers: {
            ...headers,
            ...(token && { 'x-nd-authorization': `Bearer ${token}` }),
          },
          method: method as Method,
          params,
          signal,
          url: `${baseUrl}/${api}`,
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
    jsonQuery: false,
  });
};
