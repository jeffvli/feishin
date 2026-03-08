import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServerId } from '/@/renderer/store';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSortOrderFilter = (defaultValue: null | string, listKey: ItemListKey) => {
    const serverId = useCurrentServerId();
    const { getFilter, setFilter } = useListFilterPersistence(serverId, listKey);
    const [searchParams, setSearchParams] = useSearchParams();

    const persisted = getFilter(FILTER_KEYS.SHARED.SORT_ORDER);

    const sortOrder = useMemo(() => {
        const value = parseStringParam(searchParams, FILTER_KEYS.SHARED.SORT_ORDER);
        return (value ?? persisted ?? defaultValue ?? undefined) as SortOrder;
    }, [searchParams, persisted, defaultValue]);

    const handleSetSortOrder = (sortOrder: SortOrder) => {
        setSearchParams(
            (prev) => {
                const newParams = setSearchParam(prev, FILTER_KEYS.SHARED.SORT_ORDER, sortOrder);
                return newParams;
            },
            { replace: true },
        );
        setFilter(FILTER_KEYS.SHARED.SORT_ORDER, sortOrder);
    };

    return {
        setSortOrder: handleSetSortOrder,
        sortOrder,
    };
};
