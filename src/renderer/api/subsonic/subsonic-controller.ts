import md5 from 'md5';
import { z } from 'zod';
import { ssApiClient } from '/@/renderer/api/subsonic/subsonic-api';
import { ssNormalize } from '/@/renderer/api/subsonic/subsonic-normalize';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';
import {
  ArtistInfoArgs,
  AuthenticationResponse,
  FavoriteArgs,
  FavoriteResponse,
  LibraryItem,
  MusicFolderListArgs,
  MusicFolderListResponse,
  SetRatingArgs,
  RatingResponse,
  ScrobbleArgs,
  ScrobbleResponse,
  SongListResponse,
  TopSongListArgs,
  SearchArgs,
  SearchResponse,
} from '/@/renderer/api/types';
import { randomString } from '/@/renderer/utils';

const authenticate = async (
  url: string,
  body: {
    legacy?: boolean;
    password: string;
    username: string;
  },
): Promise<AuthenticationResponse> => {
  let credential: string;
  let credentialParams: {
    p?: string;
    s?: string;
    t?: string;
    u: string;
  };

  const cleanServerUrl = url.replace(/\/$/, '');

  if (body.legacy) {
    credential = `u=${body.username}&p=${body.password}`;
    credentialParams = {
      p: body.password,
      u: body.username,
    };
  } else {
    const salt = randomString(12);
    const hash = md5(body.password + salt);
    credential = `u=${body.username}&s=${salt}&t=${hash}`;
    credentialParams = {
      s: salt,
      t: hash,
      u: body.username,
    };
  }

  await ssApiClient({ server: null, url: cleanServerUrl }).authenticate({
    query: {
      c: 'Feishin',
      f: 'json',
      v: '1.13.0',
      ...credentialParams,
    },
  });

  return {
    credential,
    userId: null,
    username: body.username,
  };
};

const getMusicFolderList = async (args: MusicFolderListArgs): Promise<MusicFolderListResponse> => {
  const { apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).getMusicFolderList({});

  if (res.status !== 200) {
    throw new Error('Failed to get music folder list');
  }

  return {
    items: res.body.musicFolders.musicFolder,
    startIndex: 0,
    totalRecordCount: res.body.musicFolders.musicFolder.length,
  };
};

// export const getAlbumArtistDetail = async (
//   args: AlbumArtistDetailArgs,
// ): Promise<SSAlbumArtistDetail> => {
//   const { server, signal, query } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams: SSAlbumArtistDetailParams = {
//     id: query.id,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('/getArtist.view', {
//       prefixUrl: server?.url,
//       searchParams,
//       signal,
//     })
//     .json<SSAlbumArtistDetailResponse>();

//   return data.artist;
// };

// const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<SSAlbumArtistList> => {
//   const { signal, server, query } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams: SSAlbumArtistListParams = {
//     musicFolderId: query.musicFolderId,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('rest/getArtists.view', {
//       prefixUrl: server?.url,
//       searchParams,
//       signal,
//     })
//     .json<SSAlbumArtistListResponse>();

//   const artists = (data.artists?.index || []).flatMap((index: SSArtistIndex) => index.artist);

//   return {
//     items: artists,
//     startIndex: query.startIndex,
//     totalRecordCount: null,
//   };
// };

// const getGenreList = async (args: GenreListArgs): Promise<SSGenreList> => {
//   const { server, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const data = await api
//     .get('rest/getGenres.view', {
//       prefixUrl: server?.url,
//       searchParams: defaultParams,
//       signal,
//     })
//     .json<SSGenreListResponse>();

//   return data.genres.genre;
// };

// const getAlbumDetail = async (args: AlbumDetailArgs): Promise<SSAlbumDetail> => {
//   const { server, query, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams = {
//     id: query.id,
//     ...defaultParams,
//   };

//   const data = await api
//     .get('rest/getAlbum.view', {
//       prefixUrl: server?.url,
//       searchParams: parseSearchParams(searchParams),
//       signal,
//     })
//     .json<SSAlbumDetailResponse>();

//   const { song: songs, ...dataWithoutSong } = data.album;
//   return { ...dataWithoutSong, songs };
// };

// const getAlbumList = async (args: AlbumListArgs): Promise<SSAlbumList> => {
//   const { server, query, signal } = args;
//   const defaultParams = getDefaultParams(server);

//   const searchParams = {
//     ...defaultParams,
//   };
//   const data = await api
//     .get('rest/getAlbumList2.view', {
//       prefixUrl: server?.url,
//       searchParams: parseSearchParams(searchParams),
//       signal,
//     })
//     .json<SSAlbumListResponse>();

//   return {
//     items: data.albumList2.album,
//     startIndex: query.startIndex,
//     totalRecordCount: null,
//   };
// };

const createFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).createFavorite({
    query: {
      albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
      artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
      id: query.type === LibraryItem.SONG ? query.id : undefined,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to create favorite');
  }

  return null;
};

const removeFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).removeFavorite({
    query: {
      albumId: query.type === LibraryItem.ALBUM ? query.id : undefined,
      artistId: query.type === LibraryItem.ALBUM_ARTIST ? query.id : undefined,
      id: query.type === LibraryItem.SONG ? query.id : undefined,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to delete favorite');
  }

  return null;
};

const setRating = async (args: SetRatingArgs): Promise<RatingResponse> => {
  const { query, apiClientProps } = args;

  const itemIds = query.item.map((item) => item.id);

  for (const id of itemIds) {
    await ssApiClient(apiClientProps).setRating({
      query: {
        id,
        rating: query.rating,
      },
    });
  }

  return null;
};

const getTopSongList = async (args: TopSongListArgs): Promise<SongListResponse> => {
  const { query, apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).getTopSongsList({
    query: {
      artist: query.artist,
      count: query.limit,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get top songs');
  }

  return {
    items:
      res.body.topSongs?.song?.map((song) => ssNormalize.song(song, apiClientProps.server, '')) ||
      [],
    startIndex: 0,
    totalRecordCount: res.body.topSongs?.song?.length || 0,
  };
};

const getArtistInfo = async (
  args: ArtistInfoArgs,
): Promise<z.infer<typeof ssType._response.artistInfo>> => {
  const { query, apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).getArtistInfo({
    query: {
      count: query.limit,
      id: query.artistId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get artist info');
  }

  return res.body;
};

const scrobble = async (args: ScrobbleArgs): Promise<ScrobbleResponse> => {
  const { query, apiClientProps } = args;

  const res = await ssApiClient(apiClientProps).scrobble({
    query: {
      id: query.id,
      submission: query.submission,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to scrobble');
  }

  return null;
};

const search3 = async (args: SearchArgs): Promise<SearchResponse> => {
  const { query, apiClientProps } = args;

  console.log('search api');

  const res = await ssApiClient(apiClientProps).search3({
    query: {
      albumCount: query.albumLimit,
      albumOffset: query.albumStartIndex,
      artistCount: query.albumArtistLimit,
      artistOffset: query.albumArtistStartIndex,
      query: query.query,
      songCount: query.songLimit,
      songOffset: query.songStartIndex,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to search');
  }

  return {
    albumArtists: res.body.searchResult3?.artist?.map((artist) =>
      ssNormalize.albumArtist(artist, apiClientProps.server),
    ),
    albums: res.body.searchResult3?.album?.map((album) =>
      ssNormalize.album(album, apiClientProps.server),
    ),
    songs: res.body.searchResult3?.song?.map((song) =>
      ssNormalize.song(song, apiClientProps.server, ''),
    ),
  };
};

export const ssController = {
  authenticate,
  createFavorite,
  getArtistInfo,
  getMusicFolderList,
  getTopSongList,
  removeFavorite,
  scrobble,
  search3,
  setRating,
};
