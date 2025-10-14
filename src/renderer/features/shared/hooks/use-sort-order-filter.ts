import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const useSortOrderFilter = (defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: SortOrder.ASC,
        key: getPersistenceKey(server.id, listKey),
    });

    const [sortOrder, setSortOrder] = useQueryState(
        FILTER_KEYS.SHARED.SORT_ORDER,
        getDefaultSortOrder(defaultValue, persisted),
    );

    const handleSetSortOrder = (sortOrder: SortOrder) => {
        setSortOrder(sortOrder);
        setPersisted(sortOrder);
    };

    return {
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder as SortOrder,
        setSortOrder: handleSetSortOrder,
    };
};

const getDefaultSortOrder = (defaultValue: null | string, persisted: null | string) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.SORT_ORDER}`;
};
