export enum Platform {
  Linux = 'linux',
  MacOS = 'macos',
  Web = 'web',
  Windows = 'windows',
}

export enum ServerType {
  Jellyfin = 'jellyfin',
  Subsonic = 'subsonic',
}

export enum Item {
  ALBUM = 'album',
  ARTIST = 'artist',
  FOLDER = 'folder',
  GENRE = 'genre',
  PLAYLIST = 'playlist',
  SONG = 'song',
}

export enum PlayerStatus {
  Paused = 'paused',
  Playing = 'playing',
}

export enum PlayerRepeat {
  All = 'all',
  None = 'none',
  One = 'one',
}

export enum Play {
  LAST = 'last',
  NEXT = 'next',
  NOW = 'now',
}

export enum CrossfadeStyle {
  ConstantPower = 'constantPower',
  ConstantPowerSlowCut = 'constantPowerSlowCut',
  ConstantPowerSlowFade = 'constantPowerSlowFade',
  Dipped = 'dipped',
  EqualPower = 'equalPower',
  Linear = 'linear',
}

export enum PlaybackStyle {
  Crossfade = 'crossfade',
  Gapless = 'gapless',
}

export enum PlaybackType {
  Local = 'local',
  Web = 'web',
}

export type APIEndpoints =
  | 'getPlaylist'
  | 'getPlaylists'
  | 'getStarred'
  | 'getAlbum'
  | 'getAlbums'
  | 'getRandomSongs'
  | 'getArtist'
  | 'getArtists'
  | 'getArtistInfo'
  | 'getArtistSongs'
  | 'startScan'
  | 'getScanStatus'
  | 'star'
  | 'unstar'
  | 'batchStar'
  | 'batchUnstar'
  | 'setRating'
  | 'getSimilarSongs'
  | 'updatePlaylistSongs'
  | 'updatePlaylistSongsLg'
  | 'deletePlaylist'
  | 'createPlaylist'
  | 'updatePlaylist'
  | 'updatePlaylistSongsLg'
  | 'deletePlaylist'
  | 'createPlaylist'
  | 'updatePlaylist'
  | 'clearPlaylist'
  | 'getGenres'
  | 'getSearch'
  | 'scrobble'
  | 'getIndexes'
  | 'getMusicFolders'
  | 'getMusicDirectory'
  | 'getMusicDirectorySongs'
  | 'getDownloadUrl'
  | 'getSongs'
  | 'getTopSongs'
  | 'getSongsByGenre'
  | 'getLyrics';

export interface GenericItem {
  id: string;
  title: string;
}

export interface APIResult {
  data: Album[] | Artist[] | Genre[] | Song[];
  totalRecordCount?: number;
}

export interface Album {
  albumArtist: Partial<AlbumArtist>;
  albumArtistId: string;
  averageRating: number;
  container: string;
  createdAt: string;
  date: string;
  deleted: boolean;
  genres: Genre[];
  id: number;
  imageUrl: string;
  name: string;
  rating: number;
  remoteCreatedAt: string;
  remoteId: string;
  serverFolderId: number;
  serverType: ServerType | string;
  songCount: number;
  songs: Song[];
  updatedAt: string;
  year: number;
}

export interface AlbumArtist {
  biography?: string;
  createdAt: string;
  deleted: boolean;
  id: number;
  name: string;
  remoteCreatedAt: string;
  remoteId: string;
  serverId: number;
  updatedAt: string;
}

export interface Artist {
  biography?: string;
  createdAt: string;
  deleted: boolean;
  id: number;
  name: string;
  remoteCreatedAt: string;
  remoteId: string;
  serverId: number;
  updatedAt: string;
}

export interface ArtistInfo {
  biography?: string;
  externalUrl: GenericItem[];
  imageUrl?: string;
  similarArtist?: Artist[];
}

export interface Genre {
  albumCount?: number;
  id: string;
  name: string;
  songCount?: number;
  type?: Item.GENRE;
  uniqueId?: string;
}

export interface Song {
  album: string;
  albumId: number;
  artistName: null;
  artists: Partial<Artist>[];
  bitRate: number;
  container: string;
  createdAt: string;
  date: string;
  deleted: boolean;
  disc: number;
  duration: number;
  genres: Partial<Genre>[];
  id: number;
  imageUrl: string;
  name: string;
  remoteCreatedAt: string;
  remoteId: string;
  serverFolderId: number;
  serverId: number;
  streamUrl: string;
  track: number;
  updatedAt: string;
  year: number;
}

export interface ScanStatus {
  count: number | 'N/a';
  scanning: boolean;
}

export interface Sort {
  column?: string;
  type: 'asc' | 'desc';
}

export interface Pagination {
  activePage?: number;
  pages?: number;
  recordsPerPage: number;
  serverSide?: boolean;
}

export interface ServerFolderAuth {
  id: number;
  locked: boolean;
  serverId: number;
  token: string;
  type: string;
  url: string;
  userId: string;
  username: string;
}

export interface UniqueId {
  uniqueId: string;
}
