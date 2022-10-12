import { Server } from '@prisma/client';
import axios from 'axios';
import {
  JFAlbumArtistsResponse,
  JFAlbumsResponse,
  JFArtistsResponse,
  JFAuthenticate,
  JFCollectionType,
  JFGenreResponse,
  JFItemType,
  JFMusicFoldersResponse,
  JFRequestParams,
  JFSongsResponse,
} from './jellyfin.types';

export const api = axios.create({});

export const authenticate = async (options: {
  password: string;
  url: string;
  username: string;
}) => {
  const { password, url, username } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  console.log('cleanServerUrl', cleanServerUrl);

  const { data } = await api.post<JFAuthenticate>(
    `${cleanServerUrl}/users/authenticatebyname`,
    { pw: password, username },
    {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Sonixd", Device="PC", DeviceId="Sonixd", Version="1.0.0-alpha1"`,
      },
    }
  );

  return data;
};

export const getMusicFolders = async (server: Partial<Server>) => {
  const { data } = await api.get<JFMusicFoldersResponse>(
    `${server.url}/users/${server.remoteUserId}/items`,
    { headers: { 'X-MediaBrowser-Token': server.token! } }
  );

  const musicFolders = data.Items.filter(
    (folder) => folder.CollectionType === JFCollectionType.MUSIC
  );

  return musicFolders;
};

export const getGenres = async (server: Server, params: JFRequestParams) => {
  const { data } = await api.get<JFGenreResponse>(`${server.url}/genres`, {
    headers: { 'X-MediaBrowser-Token': server.token },
    params,
  });

  return data;
};

export const getAlbumArtists = async (
  server: Server,
  params: JFRequestParams
) => {
  const { data } = await api.get<JFAlbumArtistsResponse>(
    `${server.url}/artists/albumArtists`,
    {
      headers: { 'X-MediaBrowser-Token': server.token },
      params,
    }
  );

  return data;
};

export const getArtists = async (server: Server, params: JFRequestParams) => {
  const { data } = await api.get<JFArtistsResponse>(`${server.url}/artists`, {
    headers: { 'X-MediaBrowser-Token': server.token },
    params,
  });

  return data;
};

export const getAlbums = async (server: Server, params: JFRequestParams) => {
  const { data } = await api.get<JFAlbumsResponse>(
    `${server.url}/users/${server.remoteUserId}/items`,
    {
      headers: { 'X-MediaBrowser-Token': server.token },
      params: { includeItemTypes: JFItemType.MUSICALBUM, ...params },
    }
  );

  return data;
};

export const getSongs = async (server: Server, params: JFRequestParams) => {
  const { data } = await api.get<JFSongsResponse>(
    `${server.url}/users/${server.remoteUserId}/items`,
    {
      headers: { 'X-MediaBrowser-Token': server.token },
      params: { includeItemTypes: JFItemType.AUDIO, ...params },
    }
  );

  return data;
};

export const jellyfinApi = {
  authenticate,
  getAlbumArtists,
  getAlbums,
  getArtists,
  getGenres,
  getMusicFolders,
  getSongs,
};
