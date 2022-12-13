import ky from 'ky';
import md5 from 'md5';
import { randomString } from '/@/utils';
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
  SSFavoriteResponse,
  SSRatingParams,
  SSRatingResponse,
  SSAlbumArtistDetailParams,
  SSAlbumArtistListParams,
} from '/@/api/subsonic.types';
import type {
  AlbumArtistDetailArgs,
  AlbumArtistListArgs,
  AlbumDetailArgs,
  AlbumListArgs,
  AuthenticationResponse,
  FavoriteArgs,
  FavoriteResponse,
  GenreListArgs,
  RatingArgs,
} from '/@/api/types';
import { useAuthStore } from '/@/store';
import { toast } from '/@/components';

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
          toast.warn({ message: 'Issue from Subsonic API' });
        }

        return new Response(JSON.stringify(data['subsonic-response']), { status: 200 });
      },
    ],
    beforeRequest: [
      (request) => {
        const server = useAuthStore.getState().currentServer;

        const searchParams = new URLSearchParams();

        if (server) {
          const authParams = server.credential.split(/&?\w=/gm);

          searchParams.set('u', server.username);
          searchParams.set('v', '1.13.0');
          searchParams.set('c', 'Feishin');
          searchParams.set('f', 'json');

          if (authParams?.length === 4) {
            searchParams.set('s', authParams[2]);
            searchParams.set('t', authParams[3]);
          } else if (authParams?.length === 3) {
            searchParams.set('p', authParams[2]);
          }
        }

        return ky(request, { searchParams });
      },
    ],
  },
});

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

const getMusicFolderList = async (
  server: any,
  signal?: AbortSignal,
): Promise<SSMusicFolderList> => {
  const data = await api
    .get('rest/getMusicFolders.view', {
      prefixUrl: server.url,
      signal,
    })
    .json<SSMusicFolderListResponse>();

  return data.musicFolders.musicFolder;
};

export const getAlbumArtistDetail = async (
  args: AlbumArtistDetailArgs,
): Promise<SSAlbumArtistDetail> => {
  const { signal, query } = args;

  const searchParams: SSAlbumArtistDetailParams = {
    id: query.id,
  };

  const data = await api
    .get('/getArtist.view', {
      searchParams,
      signal,
    })
    .json<SSAlbumArtistDetailResponse>();

  return data.artist;
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<SSAlbumArtistList> => {
  const { signal, query } = args;

  const searchParams: SSAlbumArtistListParams = {
    musicFolderId: query.musicFolderId,
  };

  const data = await api
    .get('/rest/getArtists.view', {
      searchParams,
      signal,
    })
    .json<SSAlbumArtistListResponse>();

  const artists = (data.artists?.index || []).flatMap((index: SSArtistIndex) => index.artist);

  return artists;
};

const getGenreList = async (args: GenreListArgs): Promise<SSGenreList> => {
  const { signal } = args;

  const data = await api
    .get('/rest/getGenres.view', {
      signal,
    })
    .json<SSGenreListResponse>();

  return data.genres.genre;
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<SSAlbumDetail> => {
  const { query, signal } = args;

  const data = await api
    .get('/rest/getAlbum.view', {
      searchParams: { id: query.id },
      signal,
    })
    .json<SSAlbumDetailResponse>();

  const { song: songs, ...dataWithoutSong } = data.album;
  return { ...dataWithoutSong, songs };
};

const getAlbumList = async (args: AlbumListArgs): Promise<SSAlbumList> => {
  const { query, signal } = args;

  const normalizedParams = {};
  const data = await api
    .get('/rest/getAlbumList2.view', {
      searchParams: normalizedParams,
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
  const { query, signal } = args;

  const searchParams: SSFavoriteParams = {
    albumId: query.type === 'album' ? query.id : undefined,
    artistId: query.type === 'albumArtist' ? query.id : undefined,
    id: query.type === 'song' ? query.id : undefined,
  };

  await api
    .get('/rest/star.view', {
      searchParams,
      signal,
    })
    .json<SSFavoriteResponse>();

  return {
    id: query.id,
  };
};

const deleteFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, signal } = args;

  const searchParams: SSFavoriteParams = {
    albumId: query.type === 'album' ? query.id : undefined,
    artistId: query.type === 'albumArtist' ? query.id : undefined,
    id: query.type === 'song' ? query.id : undefined,
  };

  await api
    .get('/rest/unstar.view', {
      searchParams,
      signal,
    })
    .json<SSFavoriteResponse>();

  return {
    id: query.id,
  };
};

const updateRating = async (args: RatingArgs) => {
  const { query, signal } = args;

  const searchParams: SSRatingParams = {
    id: query.id,
    rating: query.rating,
  };

  const data = await api
    .get('/rest/setRating.view', {
      searchParams,
      signal,
    })
    .json<SSRatingResponse>();

  return data;
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
