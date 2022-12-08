// Referenced from: https://betterprogramming.pub/the-best-way-to-manage-routes-in-a-react-project-with-typescript-c4e8d4422d64

export enum AppRoute {
  ACTION_REQUIRED = '/action-required',
  EXPLORE = '/explore',
  HOME = '/',
  LIBRARY_ALBUMARTISTS = '/library/album-artists',
  LIBRARY_ALBUMARTISTS_DETAIL = '/library/album-artists/:albumArtistId',
  LIBRARY_ALBUMS = '/library/albums',
  LIBRARY_ALBUMS_DETAIL = '/library/albums/:albumId',
  LIBRARY_ARTISTS = '/library/artists',
  LIBRARY_ARTISTS_DETAIL = '/library/artists/:artistId',
  LIBRARY_FOLDERS = '/library/folders',
  LIBRARY_SONGS = '/library/songs',
  NOW_PLAYING = '/now-playing',
  PLAYING = '/playing',
  PLAYLISTS = '/playlists',
  PLAYLISTS_DETAIL = '/playlists/:playlistId',
  SEARCH = '/search',
  SERVERS = '/servers',
}

type TArgs =
  | { path: AppRoute.HOME }
  | { path: AppRoute.ACTION_REQUIRED }
  | { path: AppRoute.NOW_PLAYING }
  | { path: AppRoute.EXPLORE }
  | { path: AppRoute.PLAYING }
  | { path: AppRoute.SERVERS }
  | { path: AppRoute.SEARCH }
  | { path: AppRoute.LIBRARY_ARTISTS }
  | { path: AppRoute.LIBRARY_ARTISTS_DETAIL }
  | { path: AppRoute.LIBRARY_ALBUMARTISTS }
  | {
      params: { albumArtistId: string };
      path: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL;
    }
  | { path: AppRoute.LIBRARY_ALBUMS }
  | { path: AppRoute.LIBRARY_FOLDERS }
  | { path: AppRoute.LIBRARY_SONGS }
  | {
      params: { albumId: string };
      path: AppRoute.LIBRARY_ALBUMS_DETAIL;
    };

type TArgsWithParams = Extract<TArgs, { params: any; path: any }>;

export const createPath = (args: TArgs) => {
  // eslint-disable-next-line no-prototype-builtins
  if (args.hasOwnProperty('params') === false) return args.path;

  // Create a path by replacing params in the route definition
  return Object.entries((args as TArgsWithParams).params).reduce(
    (previousValue: string, [param, value]) => previousValue.replace(`:${param}`, `${value}`),
    args.path,
  );
};
