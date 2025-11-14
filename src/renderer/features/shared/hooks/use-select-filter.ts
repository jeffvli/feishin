import { parseAsString, useQueryState } from 'nuqs';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { useCurrentServer } from '/@/renderer/store';
import { ItemListKey } from '/@/shared/types/types';

export const useSelectFilter = (
    filterKey: string,
    defaultValue: null | string,
    listKey: ItemListKey,
) => {
    const server = useCurrentServer();
    const { getFilter, setFilter } = useListFilterPersistence(server.id, listKey);

    const persisted = getFilter(filterKey);

    const [value, setValue] = useQueryState(filterKey, getDefaultValue(defaultValue, persisted));

    const handleSetValue = (newValue: string) => {
        setValue(newValue);
        setFilter(filterKey, newValue);
    };

    return {
        [filterKey]: value ?? undefined,
        setValue: handleSetValue,
        value: value ?? undefined,
    };
};

const getDefaultValue = (defaultValue: null | string, persisted: string | undefined) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};
