import {
  AlbumArtistDetailArgs,
  AlbumArtistDetailResponse,
  AddToPlaylistArgs,
  AddToPlaylistResponse,
  CreatePlaylistResponse,
  CreatePlaylistArgs,
  DeletePlaylistArgs,
  DeletePlaylistResponse,
  AlbumArtistListResponse,
  AlbumArtistListArgs,
  albumArtistListSortMap,
  sortOrderMap,
  AuthenticationResponse,
  UserListResponse,
  UserListArgs,
  userListSortMap,
  GenreListArgs,
  GenreListResponse,
  AlbumDetailResponse,
  AlbumDetailArgs,
  AlbumListArgs,
  albumListSortMap,
  AlbumListResponse,
  SongListResponse,
  SongListArgs,
  songListSortMap,
  SongDetailResponse,
  SongDetailArgs,
  UpdatePlaylistArgs,
  UpdatePlaylistResponse,
  PlaylistListResponse,
  PlaylistDetailArgs,
  PlaylistListArgs,
  playlistListSortMap,
  PlaylistDetailResponse,
  PlaylistSongListArgs,
  PlaylistSongListResponse,
  RemoveFromPlaylistResponse,
  RemoveFromPlaylistArgs,
} from '../types';
import { ndApiClient } from '/@/renderer/api/navidrome/navidrome-api';
import { ndNormalize } from '/@/renderer/api/navidrome/navidrome-normalize';
import { ndType } from '/@/renderer/api/navidrome/navidrome-types';

const authenticate = async (
  url: string,
  body: { password: string; username: string },
): Promise<AuthenticationResponse> => {
  const cleanServerUrl = url.replace(/\/$/, '');

  const res = await ndApiClient({ server: cleanServerUrl }).authenticate({
    body: {
      password: body.password,
      username: body.username,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to authenticate');
  }

  return {
    credential: `u=${body.username}&s=${res.body.data.subsonicSalt}&t=${res.body.data.subsonicToken}`,
    ndCredential: res.body.data.token,
    userId: res.body.data.id,
    username: res.body.data.username,
  };
};

const getUserList = async (args: UserListArgs): Promise<UserListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getUserList({
    query: {
      _end: query.startIndex + (query.limit || 0),
      _order: sortOrderMap.navidrome[query.sortOrder],
      _sort: userListSortMap.navidrome[query.sortBy],
      _start: query.startIndex,
      ...query.ndParams,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get user list');
  }

  return {
    items: res.body.data.map((user) => ndNormalize.user(user)),
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getGenreList = async (args: GenreListArgs): Promise<GenreListResponse> => {
  const { server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getGenreList({});

  if (res.status !== 200) {
    throw new Error('Failed to get genre list');
  }

  return {
    items: res.body.data,
    startIndex: 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getAlbumArtistDetail = async (
  args: AlbumArtistDetailArgs,
): Promise<AlbumArtistDetailResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getAlbumArtistDetail({
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get album artist detail');
  }

  return ndNormalize.albumArtist(res.body.data, server);
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<AlbumArtistListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getAlbumArtistList({
    query: {
      _end: query.startIndex + (query.limit || 0),
      _order: sortOrderMap.navidrome[query.sortOrder],
      _sort: albumArtistListSortMap.navidrome[query.sortBy],
      _start: query.startIndex,
      name: query.searchTerm,
      ...query._custom?.navidrome,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get album artist list');
  }

  return {
    items: res.body.data.map((albumArtist) => ndNormalize.albumArtist(albumArtist, server)),
    startIndex: query.startIndex,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<AlbumDetailResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const albumRes = await ndApiClient({ server, signal }).getAlbumDetail({
    params: {
      id: query.id,
    },
  });

  const songsData = await ndApiClient({ server, signal }).getSongList({
    query: {
      _end: 0,
      _order: 'ASC',
      _sort: 'album',
      _start: 0,
      album_id: [query.id],
    },
  });

  if (albumRes.status !== 200 || songsData.status !== 200) {
    throw new Error('Failed to get album detail');
  }

  return ndNormalize.album({ ...albumRes.body.data, songs: songsData.body.data }, server);
};

const getAlbumList = async (args: AlbumListArgs): Promise<AlbumListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getAlbumList({
    query: {
      _end: query.startIndex + (query.limit || 0),
      _order: sortOrderMap.navidrome[query.sortOrder],
      _sort: albumListSortMap.navidrome[query.sortBy],
      _start: query.startIndex,
      artist_id: query.artistIds?.[0],
      name: query.searchTerm,
      ...query._custom?.navidrome,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get album list');
  }

  return {
    items: res.body.data.map((album) => ndNormalize.album(album, server)),
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getSongList = async (args: SongListArgs): Promise<SongListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getSongList({
    query: {
      _end: query.startIndex + (query.limit || -1),
      _order: sortOrderMap.navidrome[query.sortOrder],
      _sort: songListSortMap.navidrome[query.sortBy],
      _start: query.startIndex,
      album_id: query.albumIds,
      artist_id: query.artistIds,
      title: query.searchTerm,
      ...query._custom?.navidrome,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get song list');
  }

  return {
    items: res.body.data.map((song) => ndNormalize.song(song, server, '')),
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getSongDetail = async (args: SongDetailArgs): Promise<SongDetailResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getSongDetail({
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get song detail');
  }

  return ndNormalize.song(res.body.data, server, '');
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
  const { body, server } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server }).createPlaylist({
    body: {
      comment: body.comment,
      name: body.name,
      public: body._custom.navidrome?.public,
      rules: body._custom.navidrome?.rules,
      sync: body._custom.navidrome?.sync,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to create playlist');
  }

  return {
    id: res.body.data.id,
    name: body.name,
  };
};

const updatePlaylist = async (args: UpdatePlaylistArgs): Promise<UpdatePlaylistResponse> => {
  const { query, body, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).updatePlaylist({
    body: {
      comment: body.comment || '',
      name: body.name,
      public: body.ndParams?.public || false,
      rules: body.ndParams?.rules ? body.ndParams?.rules : undefined,
      sync: body.ndParams?.sync || undefined,
    },
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to update playlist');
  }

  return {
    id: res.body.data.id,
  };
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<DeletePlaylistResponse> => {
  const { query, server } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server }).deletePlaylist({
    body: null,
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to delete playlist');
  }

  return null;
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<PlaylistListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getPlaylistList({
    query: {
      _end: query.startIndex + (query.limit || 0),
      _order: sortOrderMap.navidrome[query.sortOrder],
      _sort: query.sortBy ? playlistListSortMap.navidrome[query.sortBy] : undefined,
      _start: query.startIndex,
      ...query._custom?.navidrome,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist list');
  }

  return {
    items: res.body.data.map((item) => ndNormalize.playlist(item, server)),
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<PlaylistDetailResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getPlaylistDetail({
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist detail');
  }

  return ndNormalize.playlist(res.body.data, server);
};

const getPlaylistSongList = async (
  args: PlaylistSongListArgs,
): Promise<PlaylistSongListResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).getPlaylistSongList({
    params: {
      id: query.id,
    },
    query: {
      _end: query.startIndex + (query.limit || 0),
      _order: query.sortOrder ? sortOrderMap.navidrome[query.sortOrder] : 'ASC',
      _sort: query.sortBy ? songListSortMap.navidrome[query.sortBy] : ndType._enum.songList.ID,
      _start: query.startIndex,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist song list');
  }

  return {
    items: res.body.data.map((item) => ndNormalize.song(item, server, '')),
    startIndex: query?.startIndex || 0,
    totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
  };
};

const addToPlaylist = async (args: AddToPlaylistArgs): Promise<AddToPlaylistResponse> => {
  const { body, query, server } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server }).addToPlaylist({
    body: {
      ids: body.songId,
    },
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to add to playlist');
  }

  return null;
};

const removeFromPlaylist = async (
  args: RemoveFromPlaylistArgs,
): Promise<RemoveFromPlaylistResponse> => {
  const { query, server, signal } = args;

  if (!server) {
    throw new Error('No server');
  }

  const res = await ndApiClient({ server, signal }).removeFromPlaylist({
    body: null,
    params: {
      id: query.id,
    },
    query: {
      ids: query.songId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to remove from playlist');
  }

  return null;
};

export const ndController = {
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
