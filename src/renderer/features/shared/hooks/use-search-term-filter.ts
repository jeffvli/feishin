import { useDebouncedCallback } from '@mantine/hooks';
import { parseAsString, useQueryState } from 'nuqs';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';

export const useSearchTermFilter = (defaultValue?: string) => {
    const [searchTerm, setSearchTerm] = useQueryState(
        FILTER_KEYS.SHARED.SEARCH_TERM,
        defaultValue ? parseAsString.withDefault(defaultValue) : parseAsString,
    );

    const debouncedSetSearchTerm = useDebouncedCallback(setSearchTerm, 300);

    return {
        [FILTER_KEYS.SHARED.SEARCH_TERM]: searchTerm ?? undefined,
        setSearchTerm: debouncedSetSearchTerm,
    };
};
