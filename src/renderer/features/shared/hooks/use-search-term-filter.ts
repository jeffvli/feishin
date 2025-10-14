import { useDebouncedValue } from '@mantine/hooks';
import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';

export const useSearchTermFilter = (defaultValue?: string) => {
    const [searchTerm, setSearchTerm] = useQueryState(
        FILTER_KEYS.SHARED.SEARCH_TERM,
        defaultValue ? parseAsString.withDefault(defaultValue) : parseAsString,
    );

    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);

    return {
        [FILTER_KEYS.SHARED.SEARCH_TERM]: debouncedSearchTerm ?? undefined,
        rawSearchTerm: searchTerm ?? undefined,
        setSearchTerm,
    };
};
