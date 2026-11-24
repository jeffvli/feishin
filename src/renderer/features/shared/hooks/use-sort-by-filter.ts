import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSortByFilter = <TSortBy>(defaultValue: string, listKey: ItemListKey) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);
    const [searchParams, setSearchParams] = useSearchParams();

    const persisted = getFilter(FILTER_KEYS.SHARED.SORT_BY);

    const sortBy = useMemo(() => {
        const value = parseStringParam(searchParams, FILTER_KEYS.SHARED.SORT_BY);
        return (value ?? persisted ?? defaultValue ?? undefined) as TSortBy;
    }, [searchParams, persisted, defaultValue]);

    const handleSetSortBy = (sortBy: string, sortOrder?: SortOrder) => {
        runInUrlTransition(() => {
            setSearchParams(
                (prev) => {
                    const newParams = setSearchParam(prev, FILTER_KEYS.SHARED.SORT_BY, sortBy);
                    return sortOrder
                        ? setSearchParam(newParams, FILTER_KEYS.SHARED.SORT_ORDER, sortOrder)
                        : newParams;
                },
                { replace: true },
            );
            setFilter(FILTER_KEYS.SHARED.SORT_BY, sortBy);
            if (sortOrder) {
                setFilter(FILTER_KEYS.SHARED.SORT_ORDER, sortOrder);
            }
        });
    };

    return {
        setSortBy: handleSetSortBy,
        sortBy,
    };
};
