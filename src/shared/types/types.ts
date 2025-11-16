import { AppRoute } from '@ts-rest/core';
import { TFunction } from 'i18next';
import { ReactNode } from 'react';

import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';
import { ServerFeatures } from '/@/shared/types/features-types';

export enum ItemListKey {
    ALBUM = LibraryItem.ALBUM,
    ALBUM_ARTIST = LibraryItem.ALBUM_ARTIST,
    ALBUM_DETAIL = 'albumDetail',
    ARTIST = LibraryItem.ARTIST,
    FULL_SCREEN = 'fullScreen',
    GENRE = LibraryItem.GENRE,
    PLAYLIST = LibraryItem.PLAYLIST,
    PLAYLIST_SONG = LibraryItem.PLAYLIST_SONG,
    QUEUE_SONG = LibraryItem.QUEUE_SONG,
    SIDE_QUEUE = 'sideQueue',
    SONG = LibraryItem.SONG,
}

export enum ListDisplayType {
    GRID = 'poster',
    LIST = 'list',
    TABLE = 'table',
}

export enum ListPaginationType {
    INFINITE = 'infinite',
    PAGINATED = 'paginated',
}

export enum Platform {
    LINUX = 'linux',
    MACOS = 'macos',
    WEB = 'web',
    WINDOWS = 'windows',
}

export enum ServerType {
    JELLYFIN = 'jellyfin',
    NAVIDROME = 'navidrome',
    SUBSONIC = 'subsonic',
}

export type CardRoute = {
    route: AppRoute | string;
    slugs?: RouteSlug[];
};

export type CardRow<T> = {
    arrayProperty?: string;
    format?: (value: T, t: TFunction) => ReactNode;
    property: keyof T;
    route?: CardRoute;
};

export type ListPagination = {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
};

export type RouteSlug = {
    idProperty: string;
    slugProperty: string;
};

export const toServerType = (value?: string): null | ServerType => {
    switch (value?.toLowerCase()) {
        case ServerType.JELLYFIN:
            return ServerType.JELLYFIN;
        case ServerType.NAVIDROME:
            return ServerType.NAVIDROME;
        case ServerType.SUBSONIC:
            return ServerType.SUBSONIC;
        default:
            return null;
    }
};

export enum AuthState {
    INVALID = 'invalid',
    LOADING = 'loading',
    VALID = 'valid',
}

export enum CrossfadeStyle {
    CONSTANT_POWER = 'constantPower',
    CONSTANT_POWER_SLOW_CUT = 'constantPowerSlowCut',
    CONSTANT_POWER_SLOW_FADE = 'constantPowerSlowFade',
    DIPPED = 'dipped',
    EQUALPOWER = 'equalPower',
    LINEAR = 'linear',
}

export enum FontType {
    BUILT_IN = 'builtIn',
    CUSTOM = 'custom',
    SYSTEM = 'system',
}

export enum Play {
    INDEX = 'index',
    LAST = 'last',
    NEXT = 'next',
    NOW = 'now',
    SHUFFLE = 'shuffle',
}

export enum PlayerQueueType {
    DEFAULT = 'default',
    PRIORITY = 'priority',
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

export enum PlayerStatus {
    PAUSED = 'paused',
    PLAYING = 'playing',
}

export enum PlayerStyle {
    CROSSFADE = 'crossfade',
    GAPLESS = 'gapless',
}

export enum PlayerType {
    LOCAL = 'local',
    WEB = 'web',
}

export enum TableColumn {
    ACTIONS = 'actions',
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtists',
    ALBUM_COUNT = 'albumCount',
    ARTIST = 'artists',
    BIOGRAPHY = 'biography',
    BIT_RATE = 'bitRate',
    BPM = 'bpm',
    CHANNELS = 'channels',
    CODEC = 'container',
    COMMENT = 'comment',
    DATE_ADDED = 'createdAt',
    DISC_NUMBER = 'discNumber',
    DURATION = 'duration',
    GENRE = 'genres',
    GENRE_BADGE = 'genreBadge',
    ID = 'id',
    IMAGE = 'imageUrl',
    LAST_PLAYED = 'lastPlayedAt',
    OWNER = 'username',
    PATH = 'path',
    PLAY_COUNT = 'playCount',
    RELEASE_DATE = 'releaseDate',
    ROW_INDEX = 'rowIndex',
    SIZE = 'size',
    SKIP = 'skip',
    SONG_COUNT = 'songCount',
    TITLE = 'name',
    TITLE_COMBINED = 'titleCombined',
    TRACK_NUMBER = 'trackNumber',
    USER_FAVORITE = 'userFavorite',
    USER_RATING = 'userRating',
    YEAR = 'releaseYear',
}

export type DiscoveredServerItem = {
    name: string;
    type: ServerType;
    url: string;
};

export type GridCardData = {
    cardControls: any;
    cardRows: CardRow<Album | AlbumArtist | Artist | Playlist | Song>[];
    columnCount: number;
    display: ListDisplayType;
    handleFavorite: (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => void;
    handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
    itemCount: number;
    itemData: any[];
    itemGap: number;
    itemHeight: number;
    itemType: LibraryItem;
    itemWidth: number;
    playButtonBehavior: Play;
    resetInfiniteLoaderCache: () => void;
    route: CardRoute;
};

export type PlayQueueAddOptions = {
    byData?: QueueSong[];
    byItemType?: {
        id: string[];
        type: LibraryItem;
    };
    initialIndex?: number;
    initialSongId?: string;
    playType: Play;
    query?: Record<string, any>;
};

export type QueryBuilderGroup = {
    group: QueryBuilderGroup[];
    rules: QueryBuilderRule[];
    type: 'all' | 'any';
    uniqueId: string;
};

export type QueryBuilderRule = {
    field?: null | string;
    operator?: null | string;
    uniqueId: string;
    value?: any | Date | null | number | string | undefined;
};

export type ServerListItem = {
    credential: string;
    features?: ServerFeatures;
    id: string;
    name: string;
    ndCredential?: string;
    savePassword?: boolean;
    type: ServerType;
    url: string;
    userId: null | string;
    username: string;
    version?: string;
};

export type SongState = {
    position?: number;
    repeat?: PlayerRepeat;
    shuffle?: boolean;
    song?: QueueSong;
    status?: PlayerStatus;
    /** This volume is in range 0-100 */
    volume?: number;
};

export type TitleTheme = 'dark' | 'light' | 'system';

export interface UniqueId {
    uniqueId: string;
}

export type WebAudio = {
    context: AudioContext;
    gain: GainNode;
};
