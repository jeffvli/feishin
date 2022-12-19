import { nanoid } from 'nanoid/non-secure';
import ky from 'ky';
import type {
  NDGenreListResponse,
  NDArtistListResponse,
  NDAlbumDetail,
  NDAlbumListParams,
  NDAlbumList,
  NDSongDetailResponse,
  NDAlbum,
  NDSong,
  NDAuthenticationResponse,
  NDAlbumDetailResponse,
  NDSongDetail,
  NDGenreList,
  NDAlbumArtistListParams,
  NDAlbumArtistDetail,
  NDAlbumListResponse,
  NDAlbumArtistDetailResponse,
  NDAlbumArtistList,
  NDSongListParams,
  NDCreatePlaylistParams,
  NDCreatePlaylistResponse,
  NDDeletePlaylist,
  NDDeletePlaylistResponse,
  NDPlaylistListParams,
  NDPlaylistDetail,
  NDPlaylistList,
  NDPlaylistListResponse,
  NDPlaylistDetailResponse,
  NDSongList,
  NDSongListResponse,
} from '/@/renderer/api/navidrome.types';
import { NDPlaylistListSort, NDSongListSort, NDSortOrder } from '/@/renderer/api/navidrome.types';
import type {
  Album,
  Song,
  AuthenticationResponse,
  AlbumDetailArgs,
  GenreListArgs,
  AlbumListArgs,
  AlbumArtistListArgs,
  AlbumArtistDetailArgs,
  SongListArgs,
  SongDetailArgs,
  CreatePlaylistArgs,
  DeletePlaylistArgs,
  PlaylistListArgs,
  PlaylistDetailArgs,
  CreatePlaylistResponse,
  PlaylistSongListArgs,
} from '/@/renderer/api/types';
import {
  playlistListSortMap,
  albumArtistListSortMap,
  songListSortMap,
  albumListSortMap,
  sortOrderMap,
} from '/@/renderer/api/types';
import { toast } from '/@/renderer/components';
import { useAuthStore } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';
import { parseSearchParams } from '/@/renderer/utils';

const api = ky.create({
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        const serverId = useAuthStore.getState().currentServer?.id;

        if (serverId) {
          useAuthStore.getState().actions.updateServer(serverId, {
            ndCredential: response.headers.get('x-nd-authorization') as string,
          });
        }

        return response;
      },
    ],
    beforeError: [
      (error) => {
        if (error.response && error.response.status === 401) {
          toast.error({
            message: 'Your session has expired.',
          });

          const serverId = useAuthStore.getState().currentServer?.id;

          if (serverId) {
            useAuthStore.getState().actions.setCurrentServer(null);
            useAuthStore.getState().actions.updateServer(serverId, { ndCredential: undefined });
          }
        }

        return error;
      },
    ],
  },
});

const authenticate = async (
  url: string,
  body: { password: string; username: string },
): Promise<AuthenticationResponse> => {
  const cleanServerUrl = url.replace(/\/$/, '');

  const data = await ky
    .post(`${cleanServerUrl}/auth/login`, {
      json: {
        password: body.password,
        username: body.username,
      },
    })
    .json<NDAuthenticationResponse>();

  return {
    credential: `u=${body.username}&s=${data.subsonicSalt}&t=${data.subsonicToken}`,
    ndCredential: data.token,
    userId: data.id,
    username: data.username,
  };
};

const getGenreList = async (args: GenreListArgs): Promise<NDGenreList> => {
  const { server, signal } = args;

  const data = await api
    .get('api/genre', {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDGenreListResponse>();

  return data;
};

const getAlbumArtistDetail = async (args: AlbumArtistDetailArgs): Promise<NDAlbumArtistDetail> => {
  const { query, server, signal } = args;

  const data = await api
    .get(`api/artist/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDAlbumArtistDetailResponse>();

  return { ...data };
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<NDAlbumArtistList> => {
  const { query, server, signal } = args;

  const searchParams: NDAlbumArtistListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: albumArtistListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    ...query.ndParams,
  };

  const data = await api
    .get('api/artist', {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      searchParams,
      signal,
    })
    .json<NDArtistListResponse>();

  return data;
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<NDAlbumDetail> => {
  const { query, server, signal } = args;

  const data = await api
    .get(`api/album/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDAlbumDetailResponse>();

  const songsData = await api
    .get('api/song', {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      searchParams: {
        _end: 0,
        _order: NDSortOrder.ASC,
        _sort: 'album',
        _start: 0,
        album_id: query.id,
      },
      signal,
    })
    .json<NDSongListResponse>();

  return { ...data, songs: songsData };
};

const getAlbumList = async (args: AlbumListArgs): Promise<NDAlbumList> => {
  const { query, server, signal } = args;

  const searchParams: NDAlbumListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: albumListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    ...query.ndParams,
  };

  const res = await api.get('api/album', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams,
    signal,
  });

  const data = await res.json<NDAlbumListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(itemCount),
  };
};

const getSongList = async (args: SongListArgs): Promise<NDSongList> => {
  const { query, server, signal } = args;

  const searchParams: NDSongListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: songListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    ...query.ndParams,
  };

  const res = await api.get('api/song', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams,
    signal,
  });

  const data = await res.json<NDSongListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(itemCount),
  };
};

const getSongDetail = async (args: SongDetailArgs): Promise<NDSongDetail> => {
  const { query, server, signal } = args;

  const data = await api
    .get(`api/song/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDSongDetailResponse>();

  return data;
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
  const { query, server, signal } = args;

  const json: NDCreatePlaylistParams = {
    comment: query.comment,
    name: query.name,
    public: query.public || false,
  };

  const data = await api
    .post('api/playlist', {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      json,
      prefixUrl: server?.url,
      signal,
    })
    .json<NDCreatePlaylistResponse>();

  return {
    id: data.id,
    name: query.name,
  };
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<NDDeletePlaylist> => {
  const { query, server, signal } = args;

  const data = await api
    .delete(`api/playlist/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDDeletePlaylistResponse>();

  return data;
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<NDPlaylistList> => {
  const { query, server, signal } = args;

  const searchParams: NDPlaylistListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : NDSortOrder.ASC,
    _sort: query.sortBy ? playlistListSortMap.navidrome[query.sortBy] : NDPlaylistListSort.NAME,
    _start: query.startIndex,
  };

  const res = await api.get('api/playlist', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams,
    signal,
  });

  const data = await res.json<NDPlaylistListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(itemCount),
  };
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<NDPlaylistDetail> => {
  const { query, server, signal } = args;

  const data = await api
    .get(`api/playlist/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDPlaylistDetailResponse>();

  return data;
};

const getPlaylistSongList = async (args: PlaylistSongListArgs): Promise<NDSongList> => {
  const { query, server, signal } = args;

  const searchParams: NDSongListParams & { playlist_id: string } = {
    _end: query.startIndex + (query.limit || 0),
    _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : NDSortOrder.ASC,
    _sort: query.sortBy ? songListSortMap.navidrome[query.sortBy] : NDSongListSort.ID,
    _start: query.startIndex,
    playlist_id: query.id,
  };

  const data = await api
    .get(`api/playlist/${query.id}/tracks`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<NDSongListResponse>();

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: data.length,
  };
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

const normalizeAlbum = (item: NDAlbum, server: ServerListItem, imageSize?: number): Album => {
  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: item.coverArtId,
    credential: server.credential,
    size: imageSize || 300,
  });

  const imagePlaceholderUrl = imageUrl?.replace(/size=\d+/, 'size=50') || null;

  return {
    albumArtists: [{ id: item.albumArtistId, name: item.albumArtist }],
    artists: [{ id: item.artistId, name: item.artist }],
    backdropImageUrl: null,
    createdAt: item.createdAt,
    duration: null,
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
  };
};

const normalizeSong = (
  item: NDSong,
  server: ServerListItem,
  deviceId: string,
  imageSize?: number,
): Song => {
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
    path: item.path,
    playCount: item.playCount,
    releaseDate: new Date(item.year, 0, 1).toISOString(),
    releaseYear: String(item.year),
    serverId: server.id,
    size: item.size,
    streamUrl: `${server.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=feishin_${deviceId}&${server.credential}`,
    trackNumber: item.trackNumber,
    type: ServerType.NAVIDROME,
    uniqueId: nanoid(),
    updatedAt: item.updatedAt,
  };
};

export const navidromeApi = {
  authenticate,
  createPlaylist,
  deletePlaylist,
  getAlbumArtistDetail,
  getAlbumArtistList,
  getAlbumDetail,
  getAlbumList,
  getGenreList,
  getPlaylistDetail,
  getPlaylistList,
  getPlaylistSongList,
  getSongDetail,
  getSongList,
};

export const ndNormalize = {
  album: normalizeAlbum,
  song: normalizeSong,
};
