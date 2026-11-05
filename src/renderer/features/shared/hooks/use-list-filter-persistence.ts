import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { ItemListKey } from '/@/shared/types/types';

export interface ListFilterPersistence {
    [listKey: string]: {
        [filterKey: string]: string | undefined;
    };
}

const getPersistenceKey = (serverId: string) => {
    return `${serverId}-filters`;
};

export const useListFilterPersistence = (serverId: string, listKey: ItemListKey) => {
    const [persistedFilters, setPersistedFilters] = useLocalStorage<ListFilterPersistence>({
        defaultValue: {},
        key: getPersistenceKey(serverId),
    });

    const getFilter = (filterKey: string): string | undefined => {
        return persistedFilters?.[listKey]?.[filterKey];
    };

    const setFilter = (filterKey: string, value: string) => {
        setPersistedFilters((prev) => ({
            ...prev,
            [listKey]: {
                ...prev[listKey],
                [filterKey]: value,
            },
        }));
    };

    return {
        getFilter,
        setFilter,
    };
};
