import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { parseStringParam, setSearchParam } from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';

export const useSearchTermFilter = (defaultValue?: string) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const searchTerm = useMemo(() => {
        const value = parseStringParam(searchParams, FILTER_KEYS.SHARED.SEARCH_TERM);
        return value ?? defaultValue ?? undefined;
    }, [searchParams, defaultValue]);

    const handleSetSearchTerm = (value: null | string) => {
        runInUrlTransition(() => {
            setSearchParams(
                (prev) => {
                    const newParams = setSearchParam(
                        prev,
                        FILTER_KEYS.SHARED.SEARCH_TERM,
                        value === '' ? null : value,
                    );
                    return newParams;
                },
                { replace: true },
            );
        });
    };

    const debouncedSetSearchTerm = useDebouncedCallback(handleSetSearchTerm, 300);

    return {
        searchTerm: searchTerm || undefined,
        setSearchTerm: debouncedSetSearchTerm,
    };
};
