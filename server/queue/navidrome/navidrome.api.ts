import { Server } from '@prisma/client';
import axios from 'axios';
import {
  NDAlbumListResponse,
  NDGenreListResponse,
  NDAlbumListParams,
  NDGenreListParams,
  NDSongListParams,
  NDSongListResponse,
  NDArtistListResponse,
  NDAuthenticate,
} from './navidrome.types';

const api = axios.create();

const authenticate = async (options: {
  password: string;
  url: string;
  username: string;
}) => {
  const { password, url, username } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  const { data } = await api.post<NDAuthenticate>(
    `${cleanServerUrl}/auth/login`,
    { password, username }
  );

  return data;
};

const getGenres = async (server: Server, params?: NDGenreListParams) => {
  const [ndToken] = server.token.split('||');
  const { data } = await api.get<NDGenreListResponse>(
    `${server.url}/api/genre`,
    {
      headers: { 'x-nd-authorization': `Bearer ${ndToken}` },
      params,
    }
  );

  return data;
};

const getArtists = async (server: Server, params?: NDGenreListParams) => {
  const [ndToken] = server.token.split('||');
  const { data } = await api.get<NDArtistListResponse>(
    `${server.url}/api/artist`,
    {
      headers: { 'x-nd-authorization': `Bearer ${ndToken}` },
      params,
    }
  );

  return data;
};

const getAlbums = async (server: Server, params?: NDAlbumListParams) => {
  const [ndToken] = server.token.split('||');
  const { data } = await api.get<NDAlbumListResponse>(
    `${server.url}/api/album`,
    {
      headers: { 'x-nd-authorization': `Bearer ${ndToken}` },
      params,
    }
  );

  return data;
};

const getSongs = async (server: Server, params?: NDSongListParams) => {
  const [ndToken] = server.token.split('||');
  const { data } = await api.get<NDSongListResponse>(`${server.url}/api/song`, {
    headers: { 'x-nd-authorization': `Bearer ${ndToken}` },
    params,
  });

  return data;
};

export const navidromeApi = {
  authenticate,
  getAlbums,
  getArtists,
  getGenres,
  getSongs,
};
