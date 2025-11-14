import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { useCurrentServer } from '/@/renderer/store';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSortOrderFilter = (defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);

    const persisted = getFilter(FILTER_KEYS.SHARED.SORT_ORDER);

    const [sortOrder, setSortOrder] = useQueryState(
        FILTER_KEYS.SHARED.SORT_ORDER,
        getDefaultSortOrder(defaultValue, persisted),
    );

    const handleSetSortOrder = (sortOrder: SortOrder) => {
        setSortOrder(sortOrder);
        setFilter(FILTER_KEYS.SHARED.SORT_ORDER, sortOrder);
    };

    return {
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder as SortOrder,
        setSortOrder: handleSetSortOrder,
    };
};

const getDefaultSortOrder = (defaultValue: null | string, persisted: string | undefined) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};
