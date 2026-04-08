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
    setMultipleSearchParams,
    setSearchParam,
} from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { AlbumListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useAlbumListFilters = (listKey?: ItemListKey) => {
    const resolvedListKey = listKey ?? ItemListKey.ALBUM;

    const { sortBy } = useSortByFilter<AlbumListSort>(AlbumListSort.NAME, resolvedListKey);

    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, resolvedListKey);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [searchParams, setSearchParams] = useSearchParams();

    const genreId = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.ALBUM.GENRE_ID),
        [searchParams],
    );

    const albumArtist = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.ALBUM.ARTIST_IDS),
        [searchParams],
    );

    const minYear = useMemo(
        () => parseIntParam(searchParams, FILTER_KEYS.ALBUM.MIN_YEAR),
        [searchParams],
    );

    const maxYear = useMemo(
        () => parseIntParam(searchParams, FILTER_KEYS.ALBUM.MAX_YEAR),
        [searchParams],
    );

    const favorite = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.ALBUM.FAVORITE),
        [searchParams],
    );

    const compilation = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.ALBUM.COMPILATION),
        [searchParams],
    );

    const hasRating = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.ALBUM.HAS_RATING),
        [searchParams],
    );

    const recentlyPlayed = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.ALBUM.RECENTLY_PLAYED),
        [searchParams],
    );

    const custom = useMemo(
        () => parseCustomFiltersParam(searchParams, FILTER_KEYS.ALBUM._CUSTOM),
        [searchParams],
    );

    const setGenreId = useCallback(
        (value: null | string[]) => {
            runInUrlTransition(() => {
                setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.GENRE_ID, value), {
                    replace: true,
                });
            });
        },
        [setSearchParams],
    );

    const setAlbumArtist = useCallback(
        (value: null | string[]) => {
            runInUrlTransition(() => {
                setSearchParams(
                    (prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.ARTIST_IDS, value),
                    {
                        replace: true,
                    },
                );
            });
        },
        [setSearchParams],
    );

    const setMinYear = useCallback(
        (value: null | number) => {
            runInUrlTransition(() => {
                setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.MIN_YEAR, value), {
                    replace: true,
                });
            });
        },
        [setSearchParams],
    );

    const setMaxYear = useCallback(
        (value: null | number) => {
            runInUrlTransition(() => {
                setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.MAX_YEAR, value), {
                    replace: true,
                });
            });
        },
        [setSearchParams],
    );

    const setFavorite = useCallback(
        (value: boolean | null) => {
            runInUrlTransition(() => {
                setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.FAVORITE, value), {
                    replace: true,
                });
            });
        },
        [setSearchParams],
    );

    const setCompilation = useCallback(
        (value: boolean | null) => {
            runInUrlTransition(() => {
                setSearchParams(
                    (prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.COMPILATION, value),
                    {
                        replace: true,
                    },
                );
            });
        },
        [setSearchParams],
    );

    const setHasRating = useCallback(
        (value: boolean | null) => {
            runInUrlTransition(() => {
                setSearchParams(
                    (prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.HAS_RATING, value),
                    {
                        replace: true,
                    },
                );
            });
        },
        [setSearchParams],
    );

    const setRecentlyPlayed = useCallback(
        (value: boolean | null) => {
            runInUrlTransition(() => {
                setSearchParams(
                    (prev) => setSearchParam(prev, FILTER_KEYS.ALBUM.RECENTLY_PLAYED, value),
                    {
                        replace: true,
                    },
                );
            });
        },
        [setSearchParams],
    );

    const setCustom = useCallback(
        (value: null | Record<string, any>) => {
            runInUrlTransition(() => {
                setSearchParams(
                    (prev) => {
                        const previousValue = prev.get(FILTER_KEYS.ALBUM._CUSTOM);

                        const newCustom = {
                            ...(previousValue ? JSON.parse(previousValue) : {}),
                            ...value,
                        };

                        const filteredNewCustom = Object.fromEntries(
                            Object.entries(newCustom).filter(
                                ([, value]) => value !== null && value !== undefined,
                            ),
                        );

                        prev.set(FILTER_KEYS.ALBUM._CUSTOM, JSON.stringify(filteredNewCustom));
                        return prev;
                    },
                    {
                        replace: true,
                    },
                );
            });
        },
        [setSearchParams],
    );

    const clear = useCallback(() => {
        runInUrlTransition(() => {
            setSearchParams(
                (prev) =>
                    setMultipleSearchParams(
                        prev,
                        {
                            [FILTER_KEYS.ALBUM._CUSTOM]: null,
                            [FILTER_KEYS.ALBUM.ARTIST_IDS]: null,
                            [FILTER_KEYS.ALBUM.COMPILATION]: null,
                            [FILTER_KEYS.ALBUM.FAVORITE]: null,
                            [FILTER_KEYS.ALBUM.GENRE_ID]: null,
                            [FILTER_KEYS.ALBUM.HAS_RATING]: null,
                            [FILTER_KEYS.ALBUM.MAX_YEAR]: null,
                            [FILTER_KEYS.ALBUM.MIN_YEAR]: null,
                            [FILTER_KEYS.ALBUM.RECENTLY_PLAYED]: null,
                            [FILTER_KEYS.SHARED.SEARCH_TERM]: null,
                        },
                        new Set([FILTER_KEYS.ALBUM._CUSTOM]),
                    ),
                { replace: true },
            );
        });
    }, [setSearchParams]);

    const query = useMemo(
        () => ({
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
        }),
        [
            custom,
            albumArtist,
            compilation,
            favorite,
            genreId,
            hasRating,
            maxYear,
            minYear,
            recentlyPlayed,
            searchTerm,
            sortBy,
            sortOrder,
        ],
    );

    return {
        clear,
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
