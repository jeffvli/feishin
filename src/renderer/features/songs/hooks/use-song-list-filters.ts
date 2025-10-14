import {
    parseAsArrayOf,
    parseAsBoolean,
    parseAsInteger,
    parseAsJson,
    parseAsString,
    useQueryState,
} from 'nuqs';

import { useMusicFolderIdFilter } from '/@/renderer/features/shared/hooks/use-music-folder-id-filter';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { customFiltersSchema, FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { SongListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSongListFilters = () => {
    const { sortBy } = useSortByFilter<SongListSort>(null, ItemListKey.SONG);

    const { sortOrder } = useSortOrderFilter(null, ItemListKey.SONG);

    const { musicFolderId } = useMusicFolderIdFilter(null, ItemListKey.SONG);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [albumIds, setAlbumIds] = useQueryState(
        FILTER_KEYS.SONG.ALBUM_IDS,
        parseAsArrayOf(parseAsString),
    );

    const [genreId, setGenreId] = useQueryState(
        FILTER_KEYS.SONG.GENRE_ID,
        parseAsArrayOf(parseAsString),
    );

    const [artistIds, setArtistIds] = useQueryState(
        FILTER_KEYS.SONG.ARTIST_IDS,
        parseAsArrayOf(parseAsString),
    );

    const [minYear, setMinYear] = useQueryState(FILTER_KEYS.SONG.MIN_YEAR, parseAsInteger);

    const [maxYear, setMaxYear] = useQueryState(FILTER_KEYS.SONG.MAX_YEAR, parseAsInteger);

    const [favorite, setFavorite] = useQueryState(FILTER_KEYS.SONG.FAVORITE, parseAsBoolean);

    const [custom, setCustom] = useQueryState(
        FILTER_KEYS.SONG._CUSTOM,
        parseAsJson(customFiltersSchema),
    );

    const query = {
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
        [FILTER_KEYS.SONG._CUSTOM]: custom ?? undefined,
        [FILTER_KEYS.SONG.ALBUM_IDS]: albumIds ?? undefined,
        [FILTER_KEYS.SONG.ARTIST_IDS]: artistIds ?? undefined,
        [FILTER_KEYS.SONG.FAVORITE]: favorite ?? undefined,
        [FILTER_KEYS.SONG.GENRE_ID]: genreId ?? undefined,
        [FILTER_KEYS.SONG.MAX_YEAR]: maxYear ?? undefined,
        [FILTER_KEYS.SONG.MIN_YEAR]: minYear ?? undefined,
    };

    return {
        query,
        setAlbumIds,
        setArtistIds,
        setCustom,
        setFavorite,
        setGenreId,
        setMaxYear,
        setMinYear,
        setSearchTerm,
    };
};
