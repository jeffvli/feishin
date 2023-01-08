import ky from 'ky';
import md5 from 'md5';
import { parseSearchParams, randomString } from '/@/renderer/utils';
import type {
  SSAlbumListResponse,
  SSAlbumDetailResponse,
  SSArtistIndex,
  SSAlbumArtistList,
  SSAlbumArtistListResponse,
  SSGenreListResponse,
  SSMusicFolderList,
  SSMusicFolderListResponse,
  SSGenreList,
  SSAlbumDetail,
  SSAlbumList,
  SSAlbumArtistDetail,
  SSAlbumArtistDetailResponse,
  SSFavoriteParams,
  SSRatingParams,
  SSAlbumArtistDetailParams,
  SSAlbumArtistListParams,
} from '/@/renderer/api/subsonic.types';
import {
  AlbumArtistDetailArgs,
  AlbumArtistListArgs,
  AlbumDetailArgs,
  AlbumListArgs,
  AuthenticationResponse,
  FavoriteArgs,
  FavoriteResponse,
  GenreListArgs,
  LibraryItem,
  MusicFolderListArgs,
  RatingArgs,
  RatingResponse,
  ServerListItem,
} from '/@/renderer/api/types';
import { toast } from '/@/renderer/components/toast';

const getCoverArtUrl = (args: {
  baseUrl: string;
  coverArtId: string;
  credential: string;
  size: number;
}) => {
  const size = args.size ? args.size : 150;

  if (!args.coverArtId || args.coverArtId.match('2a96cbd8b46e442fc41c2b86b821562f')) {
    return null;
  }

  return (
    `${args.baseUrl}/getCoverArt.view` +
    `?id=${args.coverArtId}` +
    `&${args.credential}` +
    '&v=1.13.0' +
    '&c=feishin' +
    `&size=${size}`
  );
};

const api = ky.create({
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        const data = await response.json();
        if (data['subsonic-response'].status !== 'ok') {
          toast.error({
            message: data['subsonic-response'].error.message,
            title: 'Issue from Subsonic API',
          });
        }

        return new Response(JSON.stringify(data['subsonic-response']), { status: 200 });
      },
    ],
  },
});

const getDefaultParams = (server: ServerListItem | null) => {
  if (!server) return {};

  const authParams = server.credential.split(/&?\w=/gm);

  const params: Record<string, string> = {
    c: 'Feishin',
    f: 'json',
    u: server.username,
    v: '1.13.0',
  };

  if (authParams?.length === 4) {
    params.s = authParams[2];
    params.t = authParams[3];
  } else if (authParams?.length === 3) {
    params.p = authParams[2];
  }

  return params;
};

const authenticate = async (
  url: string,
  body: {
    legacy?: boolean;
    password: string;
    username: string;
  },
): Promise<AuthenticationResponse> => {
  let credential;
  const cleanServerUrl = url.replace(/\/$/, '');

  if (body.legacy) {
    credential = `u=${body.username}&p=${body.password}`;
  } else {
    const salt = randomString(12);
    const hash = md5(body.password + salt);
    credential = `u=${body.username}&s=${salt}&t=${hash}`;
  }

  await ky.get(`${cleanServerUrl}/rest/ping.view?v=1.13.0&c=Feishin&f=json&${credential}`);

  return {
    credential,
    userId: null,
    username: body.username,
  };
};

const getMusicFolderList = async (args: MusicFolderListArgs): Promise<SSMusicFolderList> => {
  const { signal, server } = args;
  const defaultParams = getDefaultParams(server);

  const data = await api
    .get('rest/getMusicFolders.view', {
      prefixUrl: server?.url,
      searchParams: defaultParams,
      signal,
    })
    .json<SSMusicFolderListResponse>();

  return data.musicFolders.musicFolder;
};

export const getAlbumArtistDetail = async (
  args: AlbumArtistDetailArgs,
): Promise<SSAlbumArtistDetail> => {
  const { server, signal, query } = args;
  const defaultParams = getDefaultParams(server);

  const searchParams: SSAlbumArtistDetailParams = {
    id: query.id,
    ...defaultParams,
  };

  const data = await api
    .get('/getArtist.view', {
      prefixUrl: server?.url,
      searchParams,
      signal,
    })
    .json<SSAlbumArtistDetailResponse>();

  return data.artist;
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<SSAlbumArtistList> => {
  const { signal, server, query } = args;
  const defaultParams = getDefaultParams(server);

  const searchParams: SSAlbumArtistListParams = {
    musicFolderId: query.musicFolderId,
    ...defaultParams,
  };

  const data = await api
    .get('rest/getArtists.view', {
      prefixUrl: server?.url,
      searchParams,
      signal,
    })
    .json<SSAlbumArtistListResponse>();

  const artists = (data.artists?.index || []).flatMap((index: SSArtistIndex) => index.artist);

  return {
    items: artists,
    startIndex: query.startIndex,
    totalRecordCount: null,
  };
};

const getGenreList = async (args: GenreListArgs): Promise<SSGenreList> => {
  const { server, signal } = args;
  const defaultParams = getDefaultParams(server);

  const data = await api
    .get('rest/getGenres.view', {
      prefixUrl: server?.url,
      searchParams: defaultParams,
      signal,
    })
    .json<SSGenreListResponse>();

  return data.genres.genre;
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<SSAlbumDetail> => {
  const { server, query, signal } = args;
  const defaultParams = getDefaultParams(server);

  const searchParams = {
    id: query.id,
    ...defaultParams,
  };

  const data = await api
    .get('rest/getAlbum.view', {
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<SSAlbumDetailResponse>();

  const { song: songs, ...dataWithoutSong } = data.album;
  return { ...dataWithoutSong, songs };
};

const getAlbumList = async (args: AlbumListArgs): Promise<SSAlbumList> => {
  const { server, query, signal } = args;
  const defaultParams = getDefaultParams(server);

  const searchParams = {
    ...defaultParams,
  };
  const data = await api
    .get('rest/getAlbumList2.view', {
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    })
    .json<SSAlbumListResponse>();

  return {
    items: data.albumList2.album,
    startIndex: query.startIndex,
    totalRecordCount: null,
  };
};

const createFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { server, query, signal } = args;
  const defaultParams = getDefaultParams(server);

  for (const id of query.id) {
    const searchParams: SSFavoriteParams = {
      albumId: query.type === LibraryItem.ALBUM ? id : undefined,
      artistId: query.type === LibraryItem.ALBUM_ARTIST ? id : undefined,
      id: query.type === LibraryItem.SONG ? id : undefined,
      ...defaultParams,
    };

    await api.get('rest/star.view', {
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    });
    // .json<SSFavoriteResponse>();
  }

  return {
    id: query.id,
    type: query.type,
  };
};

const deleteFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { server, query, signal } = args;
  const defaultParams = getDefaultParams(server);

  for (const id of query.id) {
    const searchParams: SSFavoriteParams = {
      albumId: query.type === LibraryItem.ALBUM ? id : undefined,
      artistId: query.type === LibraryItem.ALBUM_ARTIST ? id : undefined,
      id: query.type === LibraryItem.SONG ? id : undefined,
      ...defaultParams,
    };

    await api.get('rest/unstar.view', {
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    });
    // .json<SSFavoriteResponse>();
  }

  return {
    id: query.id,
    type: query.type,
  };
};

const updateRating = async (args: RatingArgs): Promise<RatingResponse> => {
  const { server, query, signal } = args;
  const defaultParams = getDefaultParams(server);

  for (const id of query.id) {
    const searchParams: SSRatingParams = {
      id,
      rating: query.rating,
      ...defaultParams,
    };

    await api.get('rest/setRating.view', {
      prefixUrl: server?.url,
      searchParams: parseSearchParams(searchParams),
      signal,
    });
    // .json<SSRatingResponse>();
  }

  return {
    id: query.id,
    rating: query.rating,
  };
};

export const subsonicApi = {
  authenticate,
  createFavorite,
  deleteFavorite,
  getAlbumArtistDetail,
  getAlbumArtistList,
  getAlbumDetail,
  getAlbumList,
  getCoverArtUrl,
  getGenreList,
  getMusicFolderList,
  updateRating,
};
