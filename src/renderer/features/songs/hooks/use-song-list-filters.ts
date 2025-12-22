import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import {
    parseArrayParam,
    parseBooleanParam,
    parseCustomFiltersParam,
    parseIntParam,
    setJsonSearchParam,
    setSearchParam,
} from '/@/renderer/utils/query-params';
import { SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSongListFilters = (listKey?: ItemListKey) => {
    const resolvedListKey = listKey ?? ItemListKey.SONG;

    const { setSortBy, sortBy } = useSortByFilter<SongListSort>(SongListSort.NAME, resolvedListKey);

    const { setSortOrder, sortOrder } = useSortOrderFilter(SortOrder.ASC, resolvedListKey);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [searchParams, setSearchParams] = useSearchParams();

    const albumIds = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.SONG.ALBUM_IDS),
        [searchParams],
    );

    const genreId = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.SONG.GENRE_ID),
        [searchParams],
    );

    const artistIds = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.SONG.ARTIST_IDS),
        [searchParams],
    );

    const minYear = useMemo(
        () => parseIntParam(searchParams, FILTER_KEYS.SONG.MIN_YEAR),
        [searchParams],
    );

    const maxYear = useMemo(
        () => parseIntParam(searchParams, FILTER_KEYS.SONG.MAX_YEAR),
        [searchParams],
    );

    const favorite = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.SONG.FAVORITE),
        [searchParams],
    );

    const custom = useMemo(
        () => parseCustomFiltersParam(searchParams, FILTER_KEYS.SONG._CUSTOM),
        [searchParams],
    );

    const setAlbumIds = useCallback(
        (value: null | string[]) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.ALBUM_IDS, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setGenreId = useCallback(
        (value: null | string[]) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.GENRE_ID, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setArtistIds = useCallback(
        (value: null | string[]) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.ARTIST_IDS, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setMinYear = useCallback(
        (value: null | number) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.MIN_YEAR, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setMaxYear = useCallback(
        (value: null | number) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.MAX_YEAR, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setFavorite = useCallback(
        (value: boolean | null) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.FAVORITE, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setCustom = useCallback(
        (
            value:
                | ((prev: null | Record<string, any>) => null | Record<string, any>)
                | null
                | Record<string, any>,
        ) => {
            setSearchParams(
                (prev) => {
                    const currentCustom = parseCustomFiltersParam(prev, FILTER_KEYS.SONG._CUSTOM);
                    let newValue =
                        typeof value === 'function' ? value(currentCustom ?? null) : value;
                    // Convert empty objects to null to clear them from URL
                    if (
                        newValue &&
                        typeof newValue === 'object' &&
                        Object.keys(newValue).length === 0
                    ) {
                        newValue = null;
                    }
                    return setJsonSearchParam(prev, FILTER_KEYS.SONG._CUSTOM, newValue);
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    const clear = useCallback(() => {
        setAlbumIds(null);
        setArtistIds(null);
        setCustom(null);
        setFavorite(null);
        setGenreId(null);
        setMaxYear(null);
        setMinYear(null);
        setSearchTerm(null);
        setSortBy(SongListSort.NAME);
        setSortOrder(SortOrder.ASC);
    }, [
        setAlbumIds,
        setArtistIds,
        setCustom,
        setFavorite,
        setGenreId,
        setMaxYear,
        setMinYear,
        setSearchTerm,
        setSortBy,
        setSortOrder,
    ]);

    const query = useMemo(
        () => ({
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
        }),
        [
            searchTerm,
            sortBy,
            sortOrder,
            custom,
            albumIds,
            artistIds,
            favorite,
            genreId,
            maxYear,
            minYear,
        ],
    );

    return {
        clear,
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
