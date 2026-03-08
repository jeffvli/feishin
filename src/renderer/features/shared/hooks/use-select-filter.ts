import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { useCurrentServerId } from '/@/renderer/store';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { ItemListKey } from '/@/shared/types/types';

export const useSelectFilter = (
    filterKey: string,
    defaultValue: null | string,
    listKey: ItemListKey,
) => {
    const serverId = useCurrentServerId();
    const { getFilter, setFilter } = useListFilterPersistence(serverId, listKey);
    const [searchParams, setSearchParams] = useSearchParams();

    const persisted = getFilter(filterKey);

    const value = useMemo(() => {
        const paramValue = parseStringParam(searchParams, filterKey);
        return paramValue ?? persisted ?? defaultValue ?? undefined;
    }, [searchParams, filterKey, persisted, defaultValue]);

    const handleSetValue = (newValue: string) => {
        setSearchParams(
            (prev) => {
                const newParams = setSearchParam(prev, filterKey, newValue);
                return newParams;
            },
            { replace: true },
        );
        setFilter(filterKey, newValue);
    };

    return {
        [filterKey]: value,
        setValue: handleSetValue,
        value,
    };
};
