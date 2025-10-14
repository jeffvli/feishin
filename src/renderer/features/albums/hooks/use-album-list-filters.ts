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
import { AlbumListSort, SortOrder } from '/@/shared/types/domain-types';

export const useAlbumListFilters = () => {
    const { sortBy } = useSortByFilter<AlbumListSort>(AlbumListSort.NAME);

    const { sortOrder } = useSortOrderFilter(SortOrder.ASC);

    const { musicFolderId } = useMusicFolderIdFilter('');

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [albumGenre, setAlbumGenre] = useQueryState(
        FILTER_KEYS.ALBUM.GENRES,
        parseAsArrayOf(parseAsString),
    );

    const [albumArtist, setAlbumArtist] = useQueryState(
        FILTER_KEYS.ALBUM.ARTIST_IDS,
        parseAsArrayOf(parseAsString),
    );

    const [minAlbumYear, setMinAlbumYear] = useQueryState(
        FILTER_KEYS.ALBUM.MIN_YEAR,
        parseAsInteger,
    );

    const [maxAlbumYear, setMaxAlbumYear] = useQueryState(
        FILTER_KEYS.ALBUM.MAX_YEAR,
        parseAsInteger,
    );

    const [albumFavorite, setAlbumFavorite] = useQueryState(
        FILTER_KEYS.ALBUM.FAVORITE,
        parseAsBoolean,
    );

    const [albumCompilation, setAlbumCompilation] = useQueryState(
        FILTER_KEYS.ALBUM.COMPILATION,
        parseAsBoolean,
    );

    const [albumHasRating, setAlbumHasRating] = useQueryState(
        FILTER_KEYS.ALBUM.HAS_RATING,
        parseAsBoolean,
    );

    const [albumRecentlyPlayed, setAlbumRecentlyPlayed] = useQueryState(
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
        [FILTER_KEYS.ALBUM.COMPILATION]: albumCompilation ?? undefined,
        [FILTER_KEYS.ALBUM.FAVORITE]: albumFavorite ?? undefined,
        [FILTER_KEYS.ALBUM.GENRES]: albumGenre ?? undefined,
        [FILTER_KEYS.ALBUM.HAS_RATING]: albumHasRating ?? undefined,
        [FILTER_KEYS.ALBUM.MAX_YEAR]: maxAlbumYear ?? undefined,
        [FILTER_KEYS.ALBUM.MIN_YEAR]: minAlbumYear ?? undefined,
        [FILTER_KEYS.ALBUM.RECENTLY_PLAYED]: albumRecentlyPlayed ?? undefined,
        [FILTER_KEYS.SHARED.MUSIC_FOLDER_ID]: musicFolderId ?? undefined,
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
    };

    return {
        query,
        setAlbumArtist,
        setAlbumCompilation,
        setAlbumFavorite,
        setAlbumGenre,
        setAlbumHasRating,
        setAlbumRecentlyPlayed,
        setCustom,
        setMaxAlbumYear,
        setMinAlbumYear,
        setSearchTerm,
    };
};
