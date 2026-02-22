import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useAppStore } from '/@/renderer/store/app.store';
import {
    parseArrayParam,
    parseBooleanParam,
    parseCustomFiltersParam,
    parseIntParam,
    setMultipleSearchParams,
    setSearchParam,
} from '/@/renderer/utils/query-params';
import { SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const usePlaylistSongListFilters = () => {
    const albumArtistIdsMode = useAppStore((state) => state.albumArtistIdsMode);
    const artistIdsMode = useAppStore((state) => state.artistIdsMode);
    const genreIdsMode = useAppStore((state) => state.genreIdsMode);
    const setAlbumArtistIdsModeStore = useAppStore((state) => state.actions.setAlbumArtistIdsMode);
    const setArtistIdsModeStore = useAppStore((state) => state.actions.setArtistIdsMode);
    const setGenreIdsModeStore = useAppStore((state) => state.actions.setGenreIdsMode);
    const { sortBy } = useSortByFilter<SongListSort>(SongListSort.ID, ItemListKey.PLAYLIST_SONG);

    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, ItemListKey.PLAYLIST_SONG);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [searchParams, setSearchParams] = useSearchParams();

    const albumArtistIds = useMemo(
        () => parseArrayParam(searchParams, FILTER_KEYS.SONG.ALBUM_ARTIST_IDS),
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

    const hasRating = useMemo(
        () => parseBooleanParam(searchParams, FILTER_KEYS.SONG.HAS_RATING),
        [searchParams],
    );

    const custom = useMemo(
        () => parseCustomFiltersParam(searchParams, FILTER_KEYS.SONG._CUSTOM),
        [searchParams],
    );

    const setAlbumArtistIds = useCallback(
        (value: null | string[]) => {
            setSearchParams(
                (prev) => setSearchParam(prev, FILTER_KEYS.SONG.ALBUM_ARTIST_IDS, value),
                { replace: true },
            );
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

    const setHasRating = useCallback(
        (value: boolean | null) => {
            setSearchParams((prev) => setSearchParam(prev, FILTER_KEYS.SONG.HAS_RATING, value), {
                replace: true,
            });
        },
        [setSearchParams],
    );

    const setAlbumArtistIdsMode = useCallback(
        (value: 'and' | 'or') => setAlbumArtistIdsModeStore(value),
        [setAlbumArtistIdsModeStore],
    );

    const setArtistIdsMode = useCallback(
        (value: 'and' | 'or') => setArtistIdsModeStore(value),
        [setArtistIdsModeStore],
    );

    const setGenreIdsMode = useCallback(
        (value: 'and' | 'or') => setGenreIdsModeStore(value),
        [setGenreIdsModeStore],
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

    const clear = useCallback(() => {
        setSearchParams(
            (prev) =>
                setMultipleSearchParams(
                    prev,
                    {
                        [FILTER_KEYS.SONG._CUSTOM]: null,
                        [FILTER_KEYS.SONG.ALBUM_ARTIST_IDS]: null,
                        [FILTER_KEYS.SONG.ARTIST_IDS]: null,
                        [FILTER_KEYS.SONG.FAVORITE]: null,
                        [FILTER_KEYS.SONG.GENRE_ID]: null,
                        [FILTER_KEYS.SONG.HAS_RATING]: null,
                        [FILTER_KEYS.SONG.MAX_YEAR]: null,
                        [FILTER_KEYS.SONG.MIN_YEAR]: null,
                    },
                    new Set([FILTER_KEYS.SONG._CUSTOM]),
                ),
            { replace: true },
        );
    }, [setSearchParams]);

    const query = useMemo(
        () => ({
            [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
            [FILTER_KEYS.SHARED.SORT_BY]: sortBy ?? undefined,
            [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder ?? undefined,
            [FILTER_KEYS.SONG._CUSTOM]: custom ?? undefined,
            [FILTER_KEYS.SONG.ALBUM_ARTIST_IDS]: albumArtistIds ?? undefined,
            [FILTER_KEYS.SONG.ALBUM_ARTIST_IDS_MODE]: albumArtistIdsMode,
            [FILTER_KEYS.SONG.ARTIST_IDS]: artistIds ?? undefined,
            [FILTER_KEYS.SONG.ARTIST_IDS_MODE]: artistIdsMode,
            [FILTER_KEYS.SONG.FAVORITE]: favorite ?? undefined,
            [FILTER_KEYS.SONG.GENRE_ID]: genreId ?? undefined,
            [FILTER_KEYS.SONG.GENRE_ID_MODE]: genreIdsMode,
            [FILTER_KEYS.SONG.HAS_RATING]: hasRating ?? undefined,
            [FILTER_KEYS.SONG.MAX_YEAR]: maxYear ?? undefined,
            [FILTER_KEYS.SONG.MIN_YEAR]: minYear ?? undefined,
        }),
        [
            searchTerm,
            sortBy,
            sortOrder,
            custom,
            albumArtistIds,
            albumArtistIdsMode,
            artistIds,
            artistIdsMode,
            favorite,
            genreId,
            genreIdsMode,
            hasRating,
            maxYear,
            minYear,
        ],
    );

    return {
        clear,
        query,
        setAlbumArtistIds,
        setAlbumArtistIdsMode,
        setArtistIds,
        setArtistIdsMode,
        setCustom,
        setFavorite,
        setGenreId,
        setGenreIdsMode,
        setHasRating,
        setMaxYear,
        setMinYear,
        setSearchTerm,
    };
};
