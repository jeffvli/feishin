import axios from 'axios';
import { Server } from '../../types/types';
import {
  JFAlbumArtistsResponse,
  JFAlbumsResponse,
  JFArtistsResponse,
  JFGenreResponse,
  JFMusicFoldersResponse,
  JFRequestParams,
  JFSongsResponse,
} from './jellyfin-types';

export const api = axios.create({});

export const getMusicFolders = async (server: Partial<Server>) => {
  const { data } = await api.get<JFMusicFoldersResponse>(
    `${server.url}/users/${server.remoteUserId}/items`,
    { headers: { 'X-MediaBrowser-Token': server.token! } }
  );

  const musicFolders = data.Items.filter(
    (folder) => folder.CollectionType === 'music'
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
      params: { includeItemTypes: 'MusicAlbum', ...params },
    }
  );

  return data;
};

export const getSongs = async (server: Server, params: JFRequestParams) => {
  const { data } = await api.get<JFSongsResponse>(
    `${server.url}/users/${server.remoteUserId}/items`,
    {
      headers: { 'X-MediaBrowser-Token': server.token },
      params: { includeItemTypes: 'Audio', ...params },
    }
  );

  return data;
};

export const jellyfinApi = {
  getAlbumArtists,
  getAlbums,
  getArtists,
  getGenres,
  getMusicFolders,
  getSongs,
};
