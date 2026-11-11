import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSortOrderFilter = (
    defaultValue: null | string,
    listKey: ItemListKey,
    filterKey: string = FILTER_KEYS.SHARED.SORT_ORDER,
) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);
    const [searchParams, setSearchParams] = useSearchParams();

    const persisted = getFilter(filterKey);

    const sortOrder = useMemo(() => {
        const value = parseStringParam(searchParams, filterKey);
        return (value ?? persisted ?? defaultValue ?? undefined) as SortOrder;
    }, [defaultValue, filterKey, persisted, searchParams]);

    const handleSetSortOrder = (sortOrder: SortOrder) => {
        runInUrlTransition(() => {
            setSearchParams(
                (prev) => {
                    const newParams = setSearchParam(prev, filterKey, sortOrder);
                    return newParams;
                },
                { replace: true },
            );
            setFilter(filterKey, sortOrder);
        });
    };

    return {
        setSortOrder: handleSetSortOrder,
        sortOrder,
    };
};
