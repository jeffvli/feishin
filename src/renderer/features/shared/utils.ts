import z from 'zod';

import i18n from '/@/i18n/i18n';
import { Play } from '/@/shared/types/types';

export const PLAY_TYPES = [
    {
        label: i18n.t('player.play', { postProcess: 'sentenceCase' }),
        play: Play.NOW,
    },
    {
        label: i18n.t('player.shuffle', { postProcess: 'sentenceCase' }),
        play: Play.SHUFFLE,
    },
    {
        label: i18n.t('player.addLast', { postProcess: 'sentenceCase' }),
        play: Play.LAST,
    },
    {
        label: i18n.t('player.addNext', { postProcess: 'sentenceCase' }),
        play: Play.NEXT,
    },
];

export const customFiltersSchema = z.record(z.string(), z.any());

enum AlbumFilterKeys {
    _CUSTOM = '_custom',
    ARTIST_IDS = 'artistIds',
    COMPILATION = 'compilation',
    FAVORITE = 'favorite',
    GENRE_ID = 'genreId',
    HAS_RATING = 'hasRating',
    MAX_YEAR = 'maxYear',
    MIN_YEAR = 'minYear',
    RECENTLY_PLAYED = 'recentlyPlayed',
}

enum SharedFilterKeys {
    MUSIC_FOLDER_ID = 'musicFolderId',
    SEARCH_TERM = 'searchTerm',
    SORT_BY = 'sortBy',
    SORT_ORDER = 'sortOrder',
}
enum SongFilterKeys {
    _CUSTOM = '_custom',
    ALBUM_IDS = 'albumIds',
    ARTIST_IDS = 'artistIds',
    FAVORITE = 'favorite',
    GENRE_ID = 'genreId',
    MAX_YEAR = 'maxYear',
    MIN_YEAR = 'minYear',
}

const PaginationFilterKeys = {
    CURRENT_PAGE: 'currentPage',
    SCROLL_OFFSET: 'scrollOffset',
};

export const FILTER_KEYS = {
    ALBUM: AlbumFilterKeys,
    PAGINATION: PaginationFilterKeys,
    SHARED: SharedFilterKeys,
    SONG: SongFilterKeys,
};
