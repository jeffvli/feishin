import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { ItemListKey } from '/@/shared/types/types';

export const useSortByFilter = <TSortBy>(defaultValue: null | string, listKey: ItemListKey) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: defaultValue,
        key: getPersistenceKey(server.id, listKey),
    });

    const [sortBy, setSortBy] = useQueryState(
        FILTER_KEYS.SHARED.SORT_BY,
        getDefaultSortBy(defaultValue, persisted),
    );

    const handleSetSortBy = (sortBy: string) => {
        setSortBy(sortBy);
        setPersisted(sortBy);
    };

    return {
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy as TSortBy,
        setSortBy: handleSetSortBy,
    };
};

const getDefaultSortBy = (defaultValue: null | string, persisted: null | string) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.SORT_BY}`;
};
