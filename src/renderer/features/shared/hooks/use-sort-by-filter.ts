import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';

export const useSortByFilter = <TSortBy>(defaultValue: string) => {
    const [sortBy, setSortBy] = useQueryState(
        FILTER_KEYS.SHARED.SORT_BY,
        defaultValue ? parseAsString.withDefault(defaultValue) : parseAsString,
    );

    return {
        [FILTER_KEYS.SHARED.SORT_BY]: sortBy as TSortBy,
        setSortBy,
    };
};
