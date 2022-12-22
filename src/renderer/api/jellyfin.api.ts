import ky from 'ky';
import { nanoid } from 'nanoid/non-secure';
import type {
  JFAlbum,
  JFAlbumArtistDetail,
  JFAlbumArtistDetailResponse,
  JFAlbumArtistList,
  JFAlbumArtistListParams,
  JFAlbumArtistListResponse,
  JFAlbumDetail,
  JFAlbumDetailResponse,
  JFAlbumList,
  JFAlbumListParams,
  JFAlbumListResponse,
  JFArtistList,
  JFArtistListParams,
  JFArtistListResponse,
  JFAuthenticate,
  JFCreatePlaylistResponse,
  JFGenreList,
  JFGenreListResponse,
  JFMusicFolderList,
  JFMusicFolderListResponse,
  JFPlaylistDetail,
  JFPlaylistDetailResponse,
  JFPlaylistList,
  JFPlaylistListResponse,
  JFSong,
  JFSongList,
  JFSongListParams,
  JFSongListResponse,
} from '/@/renderer/api/jellyfin.types';
import { JFCollectionType } from '/@/renderer/api/jellyfin.types';
import type {
  Album,
  AlbumArtistDetailArgs,
  AlbumArtistListArgs,
  AlbumDetailArgs,
  AlbumListArgs,
  ArtistListArgs,
  AuthenticationResponse,
  CreatePlaylistArgs,
  CreatePlaylistResponse,
  DeletePlaylistArgs,
  FavoriteArgs,
  FavoriteResponse,
  GenreListArgs,
  MusicFolderListArgs,
  PlaylistDetailArgs,
  PlaylistListArgs,
  PlaylistSongListArgs,
  Song,
  SongListArgs,
} from '/@/renderer/api/types';
import {
  songListSortMap,
  albumListSortMap,
  artistListSortMap,
  sortOrderMap,
  albumArtistListSortMap,
} from '/@/renderer/api/types';
import { useAuthStore } from '/@/renderer/store';
import { ServerListItem, ServerType } from '/@/renderer/types';
import { parseSearchParams } from '/@/renderer/utils';

const api = ky.create({});

const authenticate = async (
  url: string,
  body: {
    password: string;
    username: string;
  },
): Promise<AuthenticationResponse> => {
  const cleanServerUrl = url.replace(/\/$/, '');

  const data = await ky
    .post(`${cleanServerUrl}/users/authenticatebyname`, {
      headers: {
        'X-Emby-Authorization':
          'MediaBrowser Client="Feishin", Device="PC", DeviceId="Feishin", Version="0.0.1-alpha1"',
      },
      json: {
        pw: body.password,
        username: body.username,
      },
    })
    .json<JFAuthenticate>();

  return {
    credential: data.AccessToken,
    userId: data.User.Id,
    username: data.User.Name,
  };
};

const getMusicFolderList = async (args: MusicFolderListArgs): Promise<JFMusicFolderList> => {
  const { server, signal } = args;
  const userId = useAuthStore.getState().currentServer?.userId;

  const data = await api
    .get(`users/${userId}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      signal,
    })
    .json<JFMusicFolderListResponse>();

  const musicFolders = data.Items.filter(
    (folder) => folder.CollectionType === JFCollectionType.MUSIC,
  );

  return musicFolders;
};

const getGenreList = async (args: GenreListArgs): Promise<JFGenreList> => {
  const { signal, server } = args;

  const data = await api
    .get('genres', {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      signal,
    })
    .json<JFGenreListResponse>();
  return data;
};

const getAlbumArtistDetail = async (args: AlbumArtistDetailArgs): Promise<JFAlbumArtistDetail> => {
  const { query, server, signal } = args;

  const searchParams = {
    fields: 'Genres',
  };

  const data = await api
    .get(`/users/${server?.userId}/items/${query.id}`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFAlbumArtistDetailResponse>();

  return data;
};

// const getAlbumArtistAlbums = () => {
//   const { data: albumData } = await api.get(`/users/${auth.username}/items`, {
//     params: {
//       artistIds: options.id,
//       fields: 'AudioInfo, ParentId, Genres, DateCreated, ChildCount, ParentId',
//       includeItemTypes: 'MusicAlbum',
//       parentId: options.musicFolderId,
//       recursive: true,
//       sortBy: 'SortName',
//     },
//   });

//   const { data: similarData } = await api.get(`/artists/${options.id}/similar`, {
//     params: { limit: 15, parentId: options.musicFolderId, userId: auth.username },
//   });
// };

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<JFAlbumArtistList> => {
  const { query, server, signal } = args;

  const searchParams: JFAlbumArtistListParams = {
    limit: query.limit,
    parentId: query.musicFolderId,
    recursive: true,
    sortBy: albumArtistListSortMap.jellyfin[query.sortBy],
    sortOrder: sortOrderMap.jellyfin[query.sortOrder],
    startIndex: query.startIndex,
  };

  const data = await api
    .get('artists/albumArtists', {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFAlbumArtistListResponse>();

  return data;
};

const getArtistList = async (args: ArtistListArgs): Promise<JFArtistList> => {
  const { query, server, signal } = args;

  const searchParams: JFArtistListParams = {
    limit: query.limit,
    parentId: query.musicFolderId,
    recursive: true,
    sortBy: artistListSortMap.jellyfin[query.sortBy],
    sortOrder: sortOrderMap.jellyfin[query.sortOrder],
    startIndex: query.startIndex,
  };

  const data = await api
    .get('artists', {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFArtistListResponse>();

  return data;
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<JFAlbumDetail> => {
  const { query, server, signal } = args;

  const searchParams = {
    fields: 'Genres, DateCreated, ChildCount',
  };

  const data = await api
    .get(`users/${server?.userId}/items/${query.id}`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams,
      signal,
    })
    .json<JFAlbumDetailResponse>();

  const songsSearchParams = {
    fields: 'Genres, DateCreated, MediaSources, ParentId',
    parentId: query.id,
    sortBy: 'SortName',
  };

  const songsData = await api
    .get(`users/${server?.userId}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: songsSearchParams,
      signal,
    })
    .json<JFSongListResponse>();

  return { ...data, songs: songsData.Items };
};

const getAlbumList = async (args: AlbumListArgs): Promise<JFAlbumList> => {
  const { query, server, signal } = args;

  const yearsGroup = [];
  if (query.jfParams?.minYear && query.jfParams?.maxYear) {
    for (let i = Number(query.jfParams.minYear); i <= Number(query.jfParams.maxYear); i += 1) {
      yearsGroup.push(String(i));
    }
  }

  const yearsFilter = yearsGroup.length ? yearsGroup.join(',') : undefined;

  const searchParams: JFAlbumListParams & { maxYear?: number; minYear?: number } = {
    includeItemTypes: 'MusicAlbum',
    limit: query.limit,
    parentId: query.musicFolderId,
    recursive: true,
    searchTerm: query.searchTerm,
    sortBy: albumListSortMap.jellyfin[query.sortBy],
    sortOrder: sortOrderMap.jellyfin[query.sortOrder],
    startIndex: query.startIndex,
    ...query.jfParams,
    maxYear: undefined,
    minYear: undefined,
    years: yearsFilter,
  };

  const data = await api
    .get(`users/${server?.userId}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFAlbumListResponse>();

  return {
    items: data.Items,
    startIndex: query.startIndex,
    totalRecordCount: data.TotalRecordCount,
  };
};

const getSongList = async (args: SongListArgs): Promise<JFSongList> => {
  const { query, server, signal } = args;

  const searchParams: JFSongListParams = {
    fields: 'Genres, DateCreated, MediaSources, ParentId',
    includeItemTypes: 'Audio',
    limit: query.limit,
    parentId: query.musicFolderId,
    recursive: true,
    sortBy: songListSortMap.jellyfin[query.sortBy],
    sortOrder: sortOrderMap.jellyfin[query.sortOrder],
    startIndex: query.startIndex,
    ...query.jfParams,
  };

  const data = await api
    .get(`users/${server?.userId}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFSongListResponse>();

  return {
    items: data.Items,
    startIndex: query.startIndex,
    totalRecordCount: data.TotalRecordCount,
  };
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<JFPlaylistDetail> => {
  const { query, server, signal } = args;

  const searchParams = {
    fields: 'Genres, DateCreated, MediaSources, ChildCount, ParentId',
    ids: query.id,
  };

  const data = await api
    .get(`users/${server?.userId}/items/${query.id}`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams,
      signal,
    })
    .json<JFPlaylistDetailResponse>();

  return data;
};

const getPlaylistSongList = async (args: PlaylistSongListArgs): Promise<JFSongList> => {
  const { query, server, signal } = args;

  const searchParams: JFSongListParams = {
    fields: 'Genres, DateCreated, MediaSources, UserData, ParentId',
    includeItemTypes: 'Audio',
    sortOrder: query.sortOrder ? sortOrderMap.jellyfin[query.sortOrder] : undefined,
    startIndex: 0,
  };

  const data = await api
    .get(`playlists/${query.id}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFSongListResponse>();

  return {
    items: data.Items,
    startIndex: query.startIndex,
    totalRecordCount: data.TotalRecordCount,
  };
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<JFPlaylistList> => {
  const { server, signal } = args;

  const searchParams = {
    fields: 'ChildCount, Genres, DateCreated, ParentId, Overview',
    includeItemTypes: 'Playlist',
    recursive: true,
    sortBy: 'SortName',
    sortOrder: 'Ascending',
  };

  const data = await api
    .get(`/users/${server?.userId}/items`, {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<JFPlaylistListResponse>();

  const playlistData = data.Items.filter((item) => item.MediaType === 'Audio');

  return {
    Items: playlistData,
    StartIndex: 0,
    TotalRecordCount: playlistData.length,
  };
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
  const { query, server } = args;

  const body = {
    MediaType: 'Audio',
    Name: query.name,
    UserId: server?.userId,
  };

  const data = await api
    .post('playlists', {
      headers: { 'X-MediaBrowser-Token': server?.credential },
      json: body,
      prefixUrl: server?.url,
    })
    .json<JFCreatePlaylistResponse>();

  return {
    id: data.Id,
    name: query.name,
  };
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<null> => {
  const { query, server } = args;

  await api.delete(`items/${query.id}`, {
    headers: { 'X-MediaBrowser-Token': server?.credential },
    prefixUrl: server?.url,
  });

  return null;
};

const createFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, server } = args;

  await api.post(`users/${server?.userId}/favoriteitems/${query.id}`, {
    headers: { 'X-MediaBrowser-Token': server?.credential },
    prefixUrl: server?.url,
  });

  return {
    id: query.id,
  };
};

const deleteFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, server } = args;

  await api.delete(`users/${server?.userId}/favoriteitems/${query.id}`, {
    headers: { 'X-MediaBrowser-Token': server?.credential },
    prefixUrl: server?.url,
  });

  return {
    id: query.id,
  };
};

const getStreamUrl = (args: {
  container?: string;
  deviceId: string;
  eTag?: string;
  id: string;
  mediaSourceId?: string;
  server: ServerListItem;
}) => {
  const { id, server, deviceId } = args;

  return (
    `${server?.url}/audio` +
    `/${id}/universal` +
    `?userId=${server.userId}` +
    `&deviceId=${deviceId}` +
    '&audioCodec=aac' +
    `&api_key=${server.credential}` +
    `&playSessionId=${deviceId}` +
    '&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg' +
    '&transcodingContainer=ts' +
    '&transcodingProtocol=hls'
  );
};

const getAlbumCoverArtUrl = (args: { baseUrl: string; item: JFAlbum; size: number }) => {
  const size = args.size ? args.size : 300;

  if (!args.item.ImageTags?.Primary && !args.item?.AlbumPrimaryImageTag) {
    return null;
  }

  return (
    `${args.baseUrl}/Items` +
    `/${args.item.Id}` +
    '/Images/Primary' +
    `?width=${size}&height=${size}` +
    '&quality=96'
  );
};

const getSongCoverArtUrl = (args: { baseUrl: string; item: JFSong; size: number }) => {
  const size = args.size ? args.size : 300;

  if (!args.item.ImageTags?.Primary) {
    return null;
  }

  if (args.item.ImageTags.Primary) {
    return (
      `${args.baseUrl}/Items` +
      `/${args.item.Id}` +
      '/Images/Primary' +
      `?width=${size}&height=${size}` +
      '&quality=96'
    );
  }

  if (!args.item?.AlbumPrimaryImageTag) {
    return null;
  }

  // Fall back to album art if no image embedded
  return (
    `${args.baseUrl}/Items` +
    `/${args.item?.AlbumId}` +
    '/Images/Primary' +
    `?width=${size}&height=${size}` +
    '&quality=96'
  );
};

const normalizeAlbum = (item: JFAlbum, server: ServerListItem, imageSize?: number): Album => {
  return {
    albumArtists:
      item.AlbumArtists?.map((entry) => ({
        id: entry.Id,
        name: entry.Name,
      })) || [],
    artists: item.ArtistItems?.map((entry) => ({ id: entry.Id, name: entry.Name })),
    backdropImageUrl: null,
    createdAt: item.DateCreated,
    duration: item.RunTimeTicks / 10000000,
    genres: item.GenreItems?.map((entry) => ({ id: entry.Id, name: entry.Name })),
    id: item.Id,
    imagePlaceholderUrl: null,
    imageUrl: getAlbumCoverArtUrl({
      baseUrl: server.url,
      item,
      size: imageSize || 300,
    }),
    isCompilation: null,
    isFavorite: item.UserData?.IsFavorite || false,
    name: item.Name,
    playCount: item.UserData?.PlayCount || 0,
    rating: null,
    releaseDate: item.PremiereDate || null,
    releaseYear: item.ProductionYear,
    serverType: ServerType.JELLYFIN,
    size: null,
    songCount: item?.ChildCount || null,
    uniqueId: nanoid(),
    updatedAt: item?.DateLastMediaAdded || item.DateCreated,
  };
};

const normalizeSong = (
  item: JFSong,
  server: ServerListItem,
  deviceId: string,
  imageSize?: number,
): Song => {
  return {
    album: item.Album,
    albumArtists: item.AlbumArtists?.map((entry) => ({ id: entry.Id, name: entry.Name })),
    albumId: item.AlbumId,
    artistName: item.ArtistItems[0]?.Name,
    artists: item.ArtistItems.map((entry) => ({ id: entry.Id, name: entry.Name })),
    bitRate: item.MediaSources && Number(Math.trunc(item.MediaSources[0]?.Bitrate / 1000)),
    compilation: null,
    container: (item.MediaSources && item.MediaSources[0]?.Container) || null,
    createdAt: item.DateCreated,
    discNumber: (item.ParentIndexNumber && item.ParentIndexNumber) || 1,
    duration: item.RunTimeTicks / 10000000,
    genres: item.GenreItems.map((entry: any) => ({ id: entry.Id, name: entry.Name })),
    id: item.Id,
    imageUrl: getSongCoverArtUrl({ baseUrl: server.url, item, size: imageSize || 300 }),
    isFavorite: (item.UserData && item.UserData.IsFavorite) || false,
    name: item.Name,
    path: (item.MediaSources && item.MediaSources[0]?.Path) || null,
    playCount: (item.UserData && item.UserData.PlayCount) || 0,
    releaseDate: (item.ProductionYear && new Date(item.ProductionYear, 0, 1).toISOString()) || null,
    releaseYear: (item.ProductionYear && String(item.ProductionYear)) || null,
    serverId: server.id,
    size: item.MediaSources && item.MediaSources[0]?.Size,
    streamUrl: getStreamUrl({
      container: item.MediaSources[0]?.Container,
      deviceId,
      eTag: item.MediaSources[0]?.ETag,
      id: item.Id,
      mediaSourceId: item.MediaSources[0]?.Id,
      server,
    }),
    trackNumber: item.IndexNumber,
    type: ServerType.JELLYFIN,
    uniqueId: nanoid(),
    updatedAt: item.DateCreated,
  };
};

// const normalizeArtist = (item: any) => {
//   return {
//     album: (item.album || []).map((entry: any) => normalizeAlbum(entry)),
//     albumCount: item.AlbumCount,
//     duration: item.RunTimeTicks / 10000000,
//     genre: item.GenreItems && item.GenreItems.map((entry: any) => normalizeItem(entry)),
//     id: item.Id,
//     image: getCoverArtUrl(item),
//     info: {
//       biography: item.Overview,
//       externalUrl: (item.ExternalUrls || []).map((entry: any) => normalizeItem(entry)),
//       imageUrl: undefined,
//       similarArtist: (item.similarArtist || []).map((entry: any) => normalizeArtist(entry)),
//     },
//     starred: item.UserData && item.UserData?.IsFavorite ? 'true' : undefined,
//     title: item.Name,
//     uniqueId: nanoid(),
//   };
// };

// const normalizePlaylist = (item: any) => {
//   return {
//     changed: item.DateLastMediaAdded,
//     comment: item.Overview,
//     created: item.DateCreated,
//     duration: item.RunTimeTicks / 10000000,
//     genre: item.GenreItems && item.GenreItems.map((entry: any) => normalizeItem(entry)),
//     id: item.Id,
//     image: getCoverArtUrl(item, 350),
//     owner: undefined,
//     public: undefined,
//     song: [],
//     songCount: item.ChildCount,
//     title: item.Name,
//     uniqueId: nanoid(),
//   };
// };

// const normalizeGenre = (item: any) => {
//   return {
//     albumCount: undefined,
//     id: item.Id,
//     songCount: undefined,
//     title: item.Name,
//     type: Item.Genre,
//     uniqueId: nanoid(),
//   };
// };

// const normalizeFolder = (item: any) => {
//   return {
//     created: item.DateCreated,
//     id: item.Id,
//     image: getCoverArtUrl(item, 150),
//     isDir: true,
//     title: item.Name,
//     type: Item.Folder,
//     uniqueId: nanoid(),
//   };
// };

// const normalizeScanStatus = () => {
//   return {
//     count: 'N/a',
//     scanning: false,
//   };
// };

export const jellyfinApi = {
  authenticate,
  createFavorite,
  createPlaylist,
  deleteFavorite,
  deletePlaylist,
  getAlbumArtistDetail,
  getAlbumArtistList,
  getAlbumDetail,
  getAlbumList,
  getArtistList,
  getGenreList,
  getMusicFolderList,
  getPlaylistDetail,
  getPlaylistList,
  getPlaylistSongList,
  getSongList,
};

export const jfNormalize = {
  album: normalizeAlbum,
  song: normalizeSong,
};
