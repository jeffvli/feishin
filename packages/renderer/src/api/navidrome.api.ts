import ky from 'ky';
import { nanoid } from 'nanoid/non-secure';
import type { ServerListItem } from '../store';
import { useAuthStore } from '../store';
import { ServerType } from '../types';
import type {
  NDAlbumListResponse,
  NDGenreListResponse,
  NDAlbumListParams,
  NDGenreListParams,
  NDSongListParams,
  NDArtistListResponse,
  NDAuthenticate,
  NDAlbum,
  NDAlbumListSort,
  NDAlbumDetailResponse,
  NDSong,
  NDSongListResponse,
} from './navidrome.types';
import { NDSortOrder } from './navidrome.types';
import type {
  Album,
  AlbumDetailQuery,
  AlbumDetailResponse,
  AlbumListParams,
  AlbumListResponse,
  Song,
} from './types';
import { SortOrder } from './types';

const api = ky.create({
  hooks: {
    afterResponse: [
      (request, _options, response) => {
        // const serverId = request.headers.get('--local-id');
        return response;
      },
    ],
    beforeRequest: [
      (request, options) => {
        const { headers } = options;

        console.log('headers', headers);
        const { currentServer } = useAuthStore.getState();
        const { ndCredential } = currentServer || {};

        if (ndCredential) {
          request.headers.set('x-nd-authorization', `Bearer ${ndCredential}`);
          request.headers.set('--local-id', currentServer?.id || '');
        }
      },
    ],
  },
});

const authenticate = async (options: { password: string; url: string; username: string }) => {
  const { password, url, username } = options;
  const cleanServerUrl = url.replace(/\/$/, '');

  const data = await ky
    .post(`${cleanServerUrl}/auth/login`, {
      json: {
        password,
        username,
      },
    })
    .json<NDAuthenticate>();

  return {
    credential: `u=${options.username}&s=${data.subsonicSalt}&t=${data.subsonicToken}`,
    ndCredential: data.token,
    username: data.username,
  };
};

const getGenreList = async (params?: NDGenreListParams) => {
  const data = await api
    .get('api/genre', {
      prefixUrl: useAuthStore.getState().currentServer?.url,
      searchParams: params,
    })
    .json<NDGenreListResponse>();

  return data;
};

const getArtistList = async (params?: NDGenreListParams) => {
  const data = await api
    .get('api/artist', {
      prefixUrl: useAuthStore.getState().currentServer?.url,
      searchParams: params,
    })
    .json<NDArtistListResponse>();

  return data;
};

const getAlbumDetail = async (query: AlbumDetailQuery, signal?: AbortSignal) => {
  const albumDetail = await api
    .get(`api/album/${query.id}`, {
      prefixUrl: useAuthStore.getState().currentServer?.url,
      signal,
    })
    .json<NDAlbumDetailResponse>();

  const albumSongs = await api
    .get('api/song/', {
      prefixUrl: useAuthStore.getState().currentServer?.url,
      searchParams: {
        _end: 0,
        _order: NDSortOrder.ASC,
        _sort: 'album',
        _start: 0,
        album_id: query.id,
      },
    })
    .json<NDSongListResponse>();

  return { ...albumDetail, songs: albumSongs } as AlbumDetailResponse;
};

const getAlbumList = async (params: AlbumListParams, signal?: AbortSignal) => {
  const searchParams: NDAlbumListParams = {
    _end: params._skip + (params._take || 0),
    _order: params.sortOrder === SortOrder.ASC ? NDSortOrder.ASC : NDSortOrder.DESC,
    _sort: params.sortBy as NDAlbumListSort,
    _start: params._skip,
    ...params.nd,
  };

  const res = await api.get('api/album', {
    prefixUrl: useAuthStore.getState().currentServer?.url,
    searchParams,
    signal,
  });

  const itemCount = res.headers.get('X-Total-Count');
  const data = await res.json<NDAlbumListResponse>();

  return {
    items: data,
    pagination: {
      startIndex: params?._skip || 0,
      totalEntries: Number(itemCount),
    },
  } as AlbumListResponse;
};

const getSongList = async (params?: NDSongListParams) => {
  const data = await api
    .get('api/song', {
      prefixUrl: useAuthStore.getState().currentServer?.url,
      searchParams: params,
    })
    .json<NDSongListResponse>();

  return data;
};

export const navidromeApi = {
  authenticate,
  getAlbumDetail,
  getAlbumList,
  getArtistList,
  getGenreList,
  getSongList,
};

const getCoverArtUrl = (args: {
  baseUrl: string;
  coverArtId: string;
  credential: string;
  size: number;
}) => {
  const size = args.size ? args.size : 250;

  if (!args.coverArtId || args.coverArtId.match('2a96cbd8b46e442fc41c2b86b821562f')) {
    return null;
  }

  return (
    `${args.baseUrl}/rest/getCoverArt.view` +
    `?id=${args.coverArtId}` +
    `&${args.credential}` +
    '&v=1.13.0' +
    '&c=feishin' +
    `&size=${size}`
  );
};

const normalizeAlbum = (item: NDAlbum, server: ServerListItem, imageSize?: number) => {
  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: item.coverArtId,
    credential: server.credential,
    size: imageSize || 300,
  });

  const imagePlaceholderUrl = imageUrl?.replace(/size=\d+/, 'size=50');

  return {
    albumArtists: [{ id: item.albumArtistId, name: item.albumArtist }],
    artists: [{ id: item.artistId, name: item.artist }],
    backdropImageUrl: null,
    createdAt: item.createdAt,
    genres: item.genres,
    id: item.id,
    imagePlaceholderUrl,
    imageUrl,
    isCompilation: item.compilation,
    isFavorite: item.starred,
    name: item.name,
    playCount: item.playCount,
    rating: item.rating,
    releaseDate: new Date(item.minYear, 0, 1).toISOString(),
    releaseYear: item.minYear,
    serverType: ServerType.NAVIDROME,
    size: item.size,
    songCount: item.songCount,
    uniqueId: nanoid(),
    updatedAt: item.updatedAt,
  } as Album;
};

const normalizeSong = (
  item: NDSong,
  server: ServerListItem,
  deviceId: string,
  imageSize?: number,
) => {
  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: item.albumId,
    credential: server.credential,
    size: imageSize || 300,
  });

  return {
    album: item.album,
    albumArtists: [{ id: item.artistId, name: item.artist }],
    albumId: item.albumId,
    artistName: item.artist,
    artists: [{ id: item.artistId, name: item.artist }],
    bitRate: item.bitRate,
    compilation: item.compilation,
    container: item.suffix,
    createdAt: item.createdAt,
    discNumber: item.discNumber,
    duration: item.duration,
    genres: item.genres,
    id: item.id,
    imageUrl,
    isFavorite: item.starred,
    name: item.title,
    releaseDate: new Date(item.year, 0, 1).toISOString(),
    releaseYear: String(item.year),
    serverId: server.id,
    size: item.size,
    streamUrl: `${server.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=feishin_${deviceId}&${server.credential}`,
    trackNumber: item.trackNumber,
    type: ServerType.NAVIDROME,
    uniqueId: nanoid(),
    updatedAt: item.updatedAt,
  } as Song;
};

export const ndNormalize = {
  album: normalizeAlbum,
  song: normalizeSong,
};
