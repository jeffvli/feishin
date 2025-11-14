import { parseAsString, useQueryState } from 'nuqs';

import { useCurrentServer } from '/@/renderer/store';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { ItemListKey } from '/@/shared/types/types';

export const useSelectFilter = (
    filterKey: string,
    defaultValue: null | string,
    listKey: ItemListKey,
) => {
    const server = useCurrentServer();

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: defaultValue || '',
        key: getPersistenceKey(server.id, listKey, filterKey),
    });

    const [value, setValue] = useQueryState(filterKey, getDefaultValue(defaultValue, persisted));

    const handleSetValue = (newValue: string) => {
        setValue(newValue);
        setPersisted(newValue);
    };

    return {
        [filterKey]: value ?? undefined,
        setValue: handleSetValue,
        value: value ?? undefined,
    };
};

const getDefaultValue = (defaultValue: null | string, persisted: null | string) => {
    if (persisted) {
        return parseAsString.withDefault(persisted);
    }

    if (defaultValue) {
        return parseAsString.withDefault(defaultValue);
    }

    return parseAsString;
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey, filterKey: string) => {
    return `${serverId}-list-${listKey}-${filterKey}`;
};
