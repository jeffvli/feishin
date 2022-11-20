import { Song } from '@/renderer/api/types';
import { AppRoute } from './router/routes';

export type RouteSlug = {
  idProperty: string;
  slugProperty: string;
};

export type CardRoute = {
  route: AppRoute | string;
  slugs?: RouteSlug[];
};

export type TableType = 'nowPlaying' | 'sideQueue' | 'sideDrawerQueue';

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

export enum AlbumSort {
  DATE_ADDED = 'added',
  DATE_ADDED_REMOTE = 'addedRemote',
  DATE_RELEASED = 'released',
  DATE_RELEASED_YEAR = 'year',
  FAVORITE = 'favorite',
  NAME = 'name',
  RANDOM = 'random',
  RATING = 'rating',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum FilterGroupType {
  AND = 'AND',
  OR = 'OR',
}

export type AdvancedFilterRule = {
  field?: string | null;
  operator?: string | null;
  uniqueId: string;
  value?: string | number | Date | undefined | null | any;
};

export type AdvancedFilterGroup = {
  group: AdvancedFilterGroup[];
  rules: AdvancedFilterRule[];
  type: FilterGroupType;
  uniqueId: string;
};

export enum TableColumn {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  BIT_RATE = 'bitRate',
  DATE_ADDED = 'dateAdded',
  DISC_NUMBER = 'discNumber',
  DURATION = 'duration',
  // FAVORITE = 'favorite',
  GENRE = 'genre',
  // PATH = 'path',
  // PLAY_COUNT = 'playCount',
  // RATING = 'rating',
  RELEASE_DATE = 'releaseDate',
  ROW_INDEX = 'rowIndex',
  // SKIP = 'skip',
  // SIZE = 'size',
  TITLE = 'title',
  TITLE_COMBINED = 'titleCombined',
  TRACK_NUMBER = 'trackNumber',
  YEAR = 'releaseYear',
}

export type QueueSong = Song & UniqueId;

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
