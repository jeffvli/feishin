import {
    parseAsArrayOf,
    parseAsBoolean,
    parseAsInteger,
    parseAsJson,
    parseAsString,
    useQueryState,
} from 'nuqs';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { customFiltersSchema, FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { AlbumListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useAlbumListFilters = () => {
    const { sortBy } = useSortByFilter<AlbumListSort>(null, ItemListKey.ALBUM);

    const { sortOrder } = useSortOrderFilter(null, ItemListKey.ALBUM);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [genreId, setGenreId] = useQueryState(
        FILTER_KEYS.ALBUM.GENRE_ID,
        parseAsArrayOf(parseAsString),
    );

    const [albumArtist, setAlbumArtist] = useQueryState(
        FILTER_KEYS.ALBUM.ARTIST_IDS,
        parseAsArrayOf(parseAsString),
    );

    const [minYear, setMinYear] = useQueryState(FILTER_KEYS.ALBUM.MIN_YEAR, parseAsInteger);

    const [maxYear, setMaxYear] = useQueryState(FILTER_KEYS.ALBUM.MAX_YEAR, parseAsInteger);

    const [favorite, setFavorite] = useQueryState(FILTER_KEYS.ALBUM.FAVORITE, parseAsBoolean);

    const [compilation, setCompilation] = useQueryState(
        FILTER_KEYS.ALBUM.COMPILATION,
        parseAsBoolean,
    );

    const [hasRating, setHasRating] = useQueryState(FILTER_KEYS.ALBUM.HAS_RATING, parseAsBoolean);

    const [recentlyPlayed, setRecentlyPlayed] = useQueryState(
        FILTER_KEYS.ALBUM.RECENTLY_PLAYED,
        parseAsBoolean,
    );

    const [custom, setCustom] = useQueryState(
        FILTER_KEYS.ALBUM._CUSTOM,
        parseAsJson(customFiltersSchema),
    );

    const query = {
        [FILTER_KEYS.ALBUM._CUSTOM]: custom ?? undefined,
        [FILTER_KEYS.ALBUM.ARTIST_IDS]: albumArtist ?? undefined,
        [FILTER_KEYS.ALBUM.COMPILATION]: compilation ?? undefined,
        [FILTER_KEYS.ALBUM.FAVORITE]: favorite ?? undefined,
        [FILTER_KEYS.ALBUM.GENRE_ID]: genreId ?? undefined,
        [FILTER_KEYS.ALBUM.HAS_RATING]: hasRating ?? undefined,
        [FILTER_KEYS.ALBUM.MAX_YEAR]: maxYear ?? undefined,
        [FILTER_KEYS.ALBUM.MIN_YEAR]: minYear ?? undefined,
        [FILTER_KEYS.ALBUM.RECENTLY_PLAYED]: recentlyPlayed ?? undefined,
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        query,
        setAlbumArtist,
        setCompilation,
        setCustom,
        setFavorite,
        setGenreId,
        setHasRating,
        setMaxYear,
        setMinYear,
        setRecentlyPlayed,
        setSearchTerm,
    };
};
