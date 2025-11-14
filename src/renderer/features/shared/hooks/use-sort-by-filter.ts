import { parseAsString, useQueryState } from 'nuqs';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { ItemListKey } from '/@/shared/types/types';

export const useSortByFilter = <TSortBy>(defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);

    const persisted = getFilter(FILTER_KEYS.SHARED.SORT_BY);

    const [sortBy, setSortBy] = useQueryState(
        FILTER_KEYS.SHARED.SORT_BY,
        getDefaultSortBy(defaultValue, persisted),
    );

    const handleSetSortBy = (sortBy: string) => {
        setSortBy(sortBy);
        setFilter(FILTER_KEYS.SHARED.SORT_BY, sortBy);
    };

    return {
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy as TSortBy,
        setSortBy: handleSetSortBy,
    };
};

const getDefaultSortBy = (defaultValue: null | string, persisted: string | undefined) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};
