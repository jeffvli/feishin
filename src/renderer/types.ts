import { AppRoute } from './router/routes';

export type RouteSlug = {
  idProperty: string;
  slugProperty: string;
};

export type CardRoute = {
  route: AppRoute | string;
  slugs?: RouteSlug[];
};

export type CardRow = {
  arrayProperty?: string;
  property: string;
  route?: CardRoute;
};

export enum CardDisplayType {
  CARD = 'card',
  POSTER = 'poster',
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
  JELLYFIN = 'JELLYFIN',
  NAVIDROME = 'NAVIDROME',
  SUBSONIC = 'SUBSONIC',
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

export enum PlayerShuffle {
  ALBUM = 'album',
  NONE = 'none',
  TRACK = 'track',
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

export type PlayQueueAddOptions = {
  byData?: any[];
  byItemType?: {
    id: string;
    type: LibraryItem;
  };
  play: Play;
};

export type GridCardData = {
  cardControls: any;
  cardRows: CardRow[];
  columnCount: number;
  display: CardDisplayType;
  handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
  itemCount: number;
  itemData: any[];
  itemGap: number;
  itemHeight: number;
  itemType: LibraryItem;
  itemWidth: number;
  playButtonBehavior: Play;
  route: CardRoute;
};
