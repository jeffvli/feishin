export enum Platform {
  LINUX = 'linux',
  MACOS = 'macos',
  WEB = 'web',
  WINDOWS = 'windows',
}

export enum ServerType {
  JELLYFIN = 'jellyfin',
  SUBSONIC = 'subsonic',
}

export enum Item {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  FOLDER = 'folder',
  GENRE = 'genre',
  PLAYLIST = 'playlist',
  SONG = 'song',
}

export enum PlayerStatus {
  PAUSED = 'paused',
  PLAYING = 'playing',
}

export enum PlayerRepeat {
  ALL = 'all',
  NONE = 'none',
  ONE = 'one',
}

export enum Play {
  LAST = 'last',
  NEXT = 'next',
  NOW = 'now',
}

export enum CrossfadeStyle {
  CONSTANT_POWER = 'constantPower',
  CONSTANT_POWER_SLOW_CUT = 'constantPowerSlowCut',
  CONSTANT_POWER_SLOW_FADE = 'constantPowerSlowFade',
  DIPPED = 'dipped',
  EQUALPOWER = 'equalPower',
  LINEAR = 'linear',
}

export enum PlaybackStyle {
  CROSSFADE = 'crossfade',
  GAPLESS = 'gapless',
}

export enum PlaybackType {
  LOCAL = 'local',
  WEB = 'web',
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

export interface APIResult {
  data: Album[] | Artist[] | Genre[] | Song[];
  totalRecordCount?: number;
}

interface RelatedItem {
  deleted?: boolean;
  id: string;
  name: string;
  remoteId?: string;
}

export interface Album {
  albumArtist: AlbumArtist;
  averageRating: number;
  container: string;
  createdAt: string;
  date: string;
  deleted: boolean;
  genres: RelatedItem[];
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

export interface Genre {
  id: string;
  name: string;
}

export interface Song {
  album: RelatedItem;
  artistName: null;
  artists: RelatedItem[];
  bitRate: number;
  container: string;
  createdAt: string;
  date: string;
  deleted: boolean;
  disc: number;
  duration: number;
  genres: RelatedItem[];
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
