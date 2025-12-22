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
    setSearchParam,
} from '/@/renderer/utils/query-params';
import { SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const usePlaylistSongListFilters = () => {
    const { sortBy } = useSortByFilter<SongListSort>(SongListSort.ID, ItemListKey.PLAYLIST_SONG);

    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, ItemListKey.PLAYLIST_SONG);

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
        (value: null | Record<string, any>) => {
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
        },
        [setSearchParams],
    );

    const query = {
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
