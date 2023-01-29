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
  NDAlbumArtist,
  NDPlaylist,
  NDUpdatePlaylistParams,
  NDUpdatePlaylistResponse,
  NDPlaylistSongListResponse,
  NDPlaylistSongList,
  NDPlaylistSong,
  NDUserList,
  NDUserListResponse,
  NDUserListParams,
  NDUser,
  NDAddToPlaylist,
  NDAddToPlaylistBody,
  NDAddToPlaylistResponse,
  NDRemoveFromPlaylistParams,
  NDRemoveFromPlaylistResponse,
  NDRemoveFromPlaylist,
} from '/@/renderer/api/navidrome.types';
import { NDSongListSort, NDSortOrder } from '/@/renderer/api/navidrome.types';
import {
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
  AlbumArtist,
  Playlist,
  UpdatePlaylistResponse,
  UpdatePlaylistArgs,
  UserListArgs,
  userListSortMap,
  playlistListSortMap,
  albumArtistListSortMap,
  songListSortMap,
  albumListSortMap,
  sortOrderMap,
  User,
  LibraryItem,
  AddToPlaylistArgs,
  RemoveFromPlaylistArgs,
} from '/@/renderer/api/types';
import { toast } from '/@/renderer/components/toast';
import { useAuthStore } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';
import { parseSearchParams } from '/@/renderer/utils';
import { subsonicApi } from '/@/renderer/api/subsonic.api';

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

const getUserList = async (args: UserListArgs): Promise<NDUserList> => {
  const { query, server, signal } = args;

  const searchParams: NDUserListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: userListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    ...query.ndParams,
  };

  const res = await api.get('api/user', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
    signal,
  });

  const data = await res.json<NDUserListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(itemCount),
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

  const artistInfo = await subsonicApi.getArtistInfo({
    query: {
      artistId: query.id,
      limit: 15,
    },
    server,
    signal,
  });

  const data = await api
    .get(`api/artist/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      signal,
    })
    .json<NDAlbumArtistDetailResponse>();

  return { ...data, similarArtists: artistInfo.similarArtist };
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<NDAlbumArtistList> => {
  const { query, server, signal } = args;

  const searchParams: NDAlbumArtistListParams = {
    _end: query.startIndex + (query.limit || 0),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: albumArtistListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    name: query.searchTerm,
    ...query.ndParams,
  };

  const res = await api.get('api/artist', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
    signal,
  });

  const data = await res.json<NDArtistListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query.startIndex,
    totalRecordCount: Number(itemCount),
  };
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
    name: query.searchTerm,
    ...query.ndParams,
  };

  const res = await api.get('api/album', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
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
    _end: query.startIndex + (query.limit || -1),
    _order: sortOrderMap.navidrome[query.sortOrder],
    _sort: songListSortMap.navidrome[query.sortBy],
    _start: query.startIndex,
    album_id: query.albumIds,
    artist_id: query.artistIds,
    title: query.searchTerm,
    ...query.ndParams,
  };

  const res = await api.get('api/song', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
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
  const { body, server } = args;

  const json: NDCreatePlaylistParams = {
    comment: body.comment,
    name: body.name,
    ...body.ndParams,
    public: body.ndParams?.public || false,
    rules: body.ndParams?.rules ? body.ndParams.rules : undefined,
  };

  const data = await api
    .post('api/playlist', {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      json,
      prefixUrl: server?.url,
    })
    .json<NDCreatePlaylistResponse>();

  return {
    id: data.id,
    name: body.name,
  };
};

const updatePlaylist = async (args: UpdatePlaylistArgs): Promise<UpdatePlaylistResponse> => {
  const { query, body, server, signal } = args;

  const json: NDUpdatePlaylistParams = {
    comment: body.comment || '',
    name: body.name,
    ownerId: body.ndParams?.ownerId || undefined,
    ownerName: body.ndParams?.owner || undefined,
    public: body.ndParams?.public || false,
    rules: body.ndParams?.rules ? body.ndParams?.rules : undefined,
    sync: body.ndParams?.sync || undefined,
  };

  const data = await api
    .put(`api/playlist/${query.id}`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      json,
      prefixUrl: server?.url,
      signal,
    })
    .json<NDUpdatePlaylistResponse>();

  return {
    id: data.id,
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
    _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : undefined,
    _sort: query.sortBy ? playlistListSortMap.navidrome[query.sortBy] : undefined,
    _start: query.startIndex,
    ...query.ndParams,
  };

  const res = await api.get('api/playlist', {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
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

const getPlaylistSongList = async (args: PlaylistSongListArgs): Promise<NDPlaylistSongList> => {
  const { query, server, signal } = args;

  const searchParams: NDSongListParams & { playlist_id: string } = {
    _end: query.startIndex + (query.limit || 0),
    _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : NDSortOrder.ASC,
    _sort: query.sortBy ? songListSortMap.navidrome[query.sortBy] : NDSongListSort.ID,
    _start: query.startIndex,
    playlist_id: query.id,
  };

  const res = await api.get(`api/playlist/${query.id}/tracks`, {
    headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
    prefixUrl: server?.url,
    searchParams: parseSearchParams(searchParams),
    signal,
  });

  const data = await res.json<NDPlaylistSongListResponse>();
  const itemCount = res.headers.get('x-total-count');

  return {
    items: data,
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(itemCount),
  };
};

const addToPlaylist = async (args: AddToPlaylistArgs): Promise<NDAddToPlaylist> => {
  const { query, body, server, signal } = args;

  const json: NDAddToPlaylistBody = {
    ids: body.songId,
  };

  await api
    .post(`api/playlist/${query.id}/tracks`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      json,
      prefixUrl: server?.url,
      signal,
    })
    .json<NDAddToPlaylistResponse>();

  return null;
};

const removeFromPlaylist = async (args: RemoveFromPlaylistArgs): Promise<NDRemoveFromPlaylist> => {
  const { query, server, signal } = args;

  const searchParams: NDRemoveFromPlaylistParams = {
    id: query.songId,
  };

  await api
    .delete(`api/playlist/${query.id}/tracks`, {
      headers: { 'x-nd-authorization': `Bearer ${server?.ndCredential}` },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<NDRemoveFromPlaylistResponse>();

  return null;
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

const normalizeSong = (
  item: NDSong | NDPlaylistSong,
  server: ServerListItem,
  deviceId: string,
  imageSize?: number,
): Song => {
  let id;

  // Dynamically determine the id field based on whether or not the item is a playlist song
  if ('mediaFileId' in item) {
    id = item.mediaFileId;
  } else {
    id = item.id;
  }

  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: id,
    credential: server.credential,
    size: imageSize || 100,
  });

  const imagePlaceholderUrl = null;

  return {
    album: item.album,
    albumArtists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
    albumId: item.albumId,
    artistName: item.artist,
    artists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
    bitRate: item.bitRate,
    bpm: item.bpm ? item.bpm : null,
    channels: item.channels ? item.channels : null,
    comment: item.comment ? item.comment : null,
    compilation: item.compilation,
    container: item.suffix,
    createdAt: item.createdAt.split('T')[0],
    discNumber: item.discNumber,
    duration: item.duration,
    genres: item.genres,
    id,
    imagePlaceholderUrl,
    imageUrl,
    itemType: LibraryItem.SONG,
    lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
    name: item.title,
    path: item.path,
    playCount: item.playCount,
    releaseDate: new Date(item.year, 0, 1).toISOString(),
    releaseYear: String(item.year),
    serverId: server.id,
    serverType: ServerType.NAVIDROME,
    size: item.size,
    streamUrl: `${server.url}/rest/stream.view?id=${id}&v=1.13.0&c=feishin_${deviceId}&${server.credential}`,
    trackNumber: item.trackNumber,
    uniqueId: nanoid(),
    updatedAt: item.updatedAt,
    userFavorite: item.starred || false,
    userRating: item.rating || null,
  };
};

const normalizeAlbum = (item: NDAlbum, server: ServerListItem, imageSize?: number): Album => {
  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: item.coverArtId || item.id,
    credential: server.credential,
    size: imageSize || 300,
  });

  const imagePlaceholderUrl = null;

  const imageBackdropUrl = imageUrl?.replace(/size=\d+/, 'size=1000') || null;

  return {
    albumArtists: [{ id: item.albumArtistId, imageUrl: null, name: item.albumArtist }],
    artists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
    backdropImageUrl: imageBackdropUrl,
    createdAt: item.createdAt.split('T')[0],
    duration: item.duration * 1000 || null,
    genres: item.genres,
    id: item.id,
    imagePlaceholderUrl,
    imageUrl,
    isCompilation: item.compilation,
    itemType: LibraryItem.ALBUM,
    lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
    name: item.name,
    playCount: item.playCount,
    releaseDate: new Date(item.minYear, 0, 1).toISOString(),
    releaseYear: item.minYear,
    serverId: server.id,
    serverType: ServerType.NAVIDROME,
    size: item.size,
    songCount: item.songCount,
    songs: item.songs ? item.songs.map((song) => normalizeSong(song, server, '')) : undefined,
    uniqueId: nanoid(),
    updatedAt: item.updatedAt,
    userFavorite: item.starred,
    userRating: item.rating,
  };
};

const normalizeAlbumArtist = (item: NDAlbumArtist, server: ServerListItem): AlbumArtist => {
  const imageUrl =
    item.largeImageUrl === '/app/artist-placeholder.webp' ? null : item.largeImageUrl;

  return {
    albumCount: item.albumCount,
    backgroundImageUrl: null,
    biography: item.biography || null,
    duration: null,
    genres: item.genres,
    id: item.id,
    imageUrl: imageUrl || null,
    itemType: LibraryItem.ALBUM_ARTIST,
    lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
    name: item.name,
    playCount: item.playCount,
    serverId: server.id,
    serverType: ServerType.NAVIDROME,
    similarArtists:
      item.similarArtists?.map((artist) => ({
        id: artist.id,
        imageUrl: artist?.artistImageUrl || null,
        name: artist.name,
      })) || null,
    songCount: item.songCount,
    userFavorite: item.starred,
    userRating: item.rating,
  };
};

const normalizePlaylist = (
  item: NDPlaylist,
  server: ServerListItem,
  imageSize?: number,
): Playlist => {
  const imageUrl = getCoverArtUrl({
    baseUrl: server.url,
    coverArtId: item.id,
    credential: server.credential,
    size: imageSize || 300,
  });

  const imagePlaceholderUrl = null;

  return {
    description: item.comment,
    duration: item.duration * 1000,
    genres: [],
    id: item.id,
    imagePlaceholderUrl,
    imageUrl,
    itemType: LibraryItem.PLAYLIST,
    name: item.name,
    owner: item.ownerName,
    ownerId: item.ownerId,
    public: item.public,
    rules: item?.rules || null,
    serverId: server.id,
    serverType: ServerType.NAVIDROME,
    size: item.size,
    songCount: item.songCount,
    sync: item.sync,
  };
};

const normalizeUser = (item: NDUser): User => {
  return {
    createdAt: item.createdAt,
    email: item.email,
    id: item.id,
    isAdmin: item.isAdmin,
    lastLoginAt: item.lastLoginAt,
    name: item.userName,
    updatedAt: item.updatedAt,
  };
};

export const navidromeApi = {
  addToPlaylist,
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
  getUserList,
  removeFromPlaylist,
  updatePlaylist,
};

export const ndNormalize = {
  album: normalizeAlbum,
  albumArtist: normalizeAlbumArtist,
  playlist: normalizePlaylist,
  song: normalizeSong,
  user: normalizeUser,
};
