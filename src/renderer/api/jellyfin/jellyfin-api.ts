import { useAuthStore, useSettingsStore } from '/@/renderer/store';
import { jfType } from '/@/renderer/api/jellyfin/jellyfin-types';
import { initClient, initContract } from '@ts-rest/core';
import axios, { AxiosError, AxiosResponse, isAxiosError, Method } from 'axios';
import qs from 'qs';
import { ServerListItem } from '/@/renderer/types';
import omitBy from 'lodash/omitBy';
import packageJson from '../../../../package.json';
import { z } from 'zod';
import isElectron from 'is-electron';
import { authenticationFailure } from '/@/renderer/api/utils';

const localSettings = isElectron() ? window.electron.localSettings : null;

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
    responses: {
      200: jfType._response.genreList,
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
  getSimilarArtistList: {
    method: 'GET',
    path: 'artists/:id/similar',
    query: jfType._parameters.similarArtistList,
    responses: {
      200: jfType._response.albumArtistList,
      400: jfType._response.error,
    },
  },
  getSongDetail: {
    method: 'GET',
    path: 'song/:id',
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
    path: 'users/:userId/Items/:id/Lyrics',
    responses: {
      200: jfType._response.lyrics,
      404: jfType._response.error,
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

const axiosClient = axios.create({});

axiosClient.defaults.paramsSerializer = (params) => {
  return qs.stringify(params, { arrayFormat: 'repeat' });
};

let authSuccess = true;
let shouldDelay = false;

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

axiosClient.interceptors.response.use(
  (response) => {
    authSuccess = true;
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentServer = useAuthStore.getState().currentServer;

      if (useSettingsStore.getState().general.savePassword && localSettings && currentServer) {
        // eslint-disable-next-line promise/no-promise-in-callback
        return localSettings
          .passwordGet(currentServer.id)
          .then(async (password: string | null) => {
            authSuccess = false;

            if (password === null) {
              throw error;
            }

            if (shouldDelay) {
              await waitForResult();

              // Hopefully the delay was sufficient for authentication.
              // Otherwise, it will require manual intervention
              if (authSuccess) {
                return axiosClient.request(error.config);
              }

              throw error;
            }

            shouldDelay = true;

            // Do not use axiosClient. Instead, manually make a post
            const response = await axios.post(
              `${currentServer.url}/users/authenticatebyname`,
              {
                Pw: password,
                Username: currentServer.username,
              },
              {
                headers: {
                  'x-emby-authorization': `MediaBrowser Client="Feishin", Device="PC", DeviceId="Feishin", Version="${packageJson.version}"`,
                },
              },
            );

            if (response.status !== 200) {
              throw new Error('Failed to authenticate');
            }

            const newCredential = response.data.AccessToken;

            useAuthStore
              .getState()
              .actions.updateServer(currentServer.id, { credential: newCredential });

            error.config.headers['X-MediaBrowser-Token'] = newCredential;

            authSuccess = true;

            return axiosClient.request(error.config);
          })
          .catch((newError: any) => {
            console.error('Error when trying to reauthenticate: ', newError);
            authenticationFailure(currentServer);
          })
          .finally(() => {
            shouldDelay = false;
          });
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
        const result = await axiosClient.request({
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
        return {
          body: result.data,
          headers: result.headers as any,
          status: result.status,
        };
      } catch (e: Error | AxiosError | any) {
        if (isAxiosError(e)) {
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
