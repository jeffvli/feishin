import { AppRoute } from './router/routes';

export interface CardRow {
  align?: 'left' | 'center' | 'right';
  prop: string;
  route?: {
    prop: string;
    route: AppRoute | string;
  };
}

export enum LibraryItem {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  PLAYLIST = 'playlist',
  SONG = 'song',
}

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

export interface UniqueId {
  uniqueId: string;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
