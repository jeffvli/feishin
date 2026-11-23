import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { ItemListKey } from '/@/shared/types/types';

export const useSortByFilter = <TSortBy>(
    defaultValue: string,
    listKey: ItemListKey,
    filterKey: string = FILTER_KEYS.SHARED.SORT_BY,
) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);
    const [searchParams, setSearchParams] = useSearchParams();

    const persisted = getFilter(filterKey);

    const sortBy = useMemo(() => {
        const value = parseStringParam(searchParams, filterKey);
        return (value ?? persisted ?? defaultValue ?? undefined) as TSortBy;
    }, [defaultValue, filterKey, persisted, searchParams]);

    const handleSetSortBy = (sortBy: string) => {
        runInUrlTransition(() => {
            setSearchParams(
                (prev) => {
                    const newParams = setSearchParam(prev, filterKey, sortBy);
                    return newParams;
                },
                { replace: true },
            );
            setFilter(filterKey, sortBy);
        });
    };

    return {
        setSortBy: handleSetSortBy,
        sortBy,
    };
};
