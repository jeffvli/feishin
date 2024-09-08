import { ReactNode } from 'react';
import { ServerFeatures } from '/@/renderer/api/features-types';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    QueueSong,
    Song,
} from '/@/renderer/api/types';
import { AppRoute } from '/@/renderer/router/routes';

export type TablePagination = {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
};

export type RouteSlug = {
    idProperty: string;
    slugProperty: string;
};

export type CardRoute = {
    route: AppRoute | string;
    slugs?: RouteSlug[];
};

export type TableType =
    | 'nowPlaying'
    | 'sideQueue'
    | 'sideDrawerQueue'
    | 'songs'
    | 'fullScreen'
    | 'albumDetail';

export type CardRow<T> = {
    arrayProperty?: string;
    format?: (value: T) => ReactNode;
    property: keyof T;
    route?: CardRoute;
};

export enum ListDisplayType {
    CARD = 'card',
    POSTER = 'poster',
    TABLE = 'table',
    TABLE_PAGINATED = 'paginatedTable',
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

export const toServerType = (value?: string): ServerType | null => {
    switch (value?.toLowerCase()) {
        case ServerType.JELLYFIN:
            return ServerType.JELLYFIN;
        case ServerType.NAVIDROME:
            return ServerType.NAVIDROME;
        default:
            return null;
    }
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
    userId: string | null;
    username: string;
    version?: string;
};

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
    SHUFFLE = 'shuffle',
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

export type QueryBuilderRule = {
    field?: string | null;
    operator?: string | null;
    uniqueId: string;
    value?: string | number | Date | undefined | null | any;
};

export type QueryBuilderGroup = {
    group: QueryBuilderGroup[];
    rules: QueryBuilderRule[];
    type: 'any' | 'all';
    uniqueId: string;
};

export enum TableColumn {
    ACTIONS = 'actions',
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ALBUM_COUNT = 'albumCount',
    ARTIST = 'artist',
    BIOGRAPHY = 'biography',
    BIT_RATE = 'bitRate',
    BPM = 'bpm',
    CHANNELS = 'channels',
    CODEC = 'codec',
    COMMENT = 'comment',
    DATE_ADDED = 'dateAdded',
    DISC_NUMBER = 'discNumber',
    DURATION = 'duration',
    GENRE = 'genre',
    LAST_PLAYED = 'lastPlayedAt',
    OWNER = 'username',
    PATH = 'path',
    PLAY_COUNT = 'playCount',
    RELEASE_DATE = 'releaseDate',
    ROW_INDEX = 'rowIndex',
    SIZE = 'size',
    SKIP = 'skip',
    SONG_COUNT = 'songCount',
    TITLE = 'title',
    TITLE_COMBINED = 'titleCombined',
    TRACK_NUMBER = 'trackNumber',
    USER_FAVORITE = 'userFavorite',
    USER_RATING = 'userRating',
    YEAR = 'releaseYear',
}

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

export type SongState = {
    position?: number;
    repeat?: PlayerRepeat;
    shuffle?: boolean;
    song?: QueueSong;
    status?: PlayerStatus;
    /** This volume is in range 0-100 */
    volume?: number;
};

export enum FontType {
    BUILT_IN = 'builtIn',
    CUSTOM = 'custom',
    SYSTEM = 'system',
}

export type TitleTheme = 'dark' | 'light' | 'system';

export enum AuthState {
    INVALID = 'invalid',
    LOADING = 'loading',
    VALID = 'valid',
}
