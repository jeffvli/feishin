import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { SortOrder } from '/@/shared/types/domain-types';

export const useSortOrderFilter = (defaultValue: string) => {
    const [sortOrder, setSortOrder] = useQueryState(
        FILTER_KEYS.SHARED.SORT_ORDER,
        defaultValue ? parseAsString.withDefault(defaultValue) : parseAsString,
    );

    return {
        [FILTER_KEYS.SHARED.SORT_ORDER]: sortOrder as SortOrder,
        setSortOrder,
    };
};
