import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { parseCustomFiltersParam } from '/@/renderer/utils/query-params';
import { PlaylistListSort } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const usePlaylistListFilters = () => {
    const sortByFilter = useSortByFilter<PlaylistListSort>(null, ItemListKey.PLAYLIST);
    const sortOrderFilter = useSortOrderFilter(null, ItemListKey.PLAYLIST);

    const { searchTerm, setSearchTerm } = useSearchTermFilter('');

    const [searchParams, setSearchParams] = useSearchParams();

    const custom = useMemo(
        () => parseCustomFiltersParam(searchParams, FILTER_KEYS.PLAYLIST.CUSTOM),
        [searchParams],
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

    const query = useMemo(
        () => ({
            _custom: custom ?? undefined,
            searchTerm: searchTerm ?? undefined,
            sortBy: sortByFilter.sortBy ?? undefined,
            sortOrder: sortOrderFilter.sortOrder ?? undefined,
        }),
        [custom, searchTerm, sortByFilter.sortBy, sortOrderFilter.sortOrder],
    );

    return {
        query,
        setCustom,
        setSearchTerm,
    };
};
