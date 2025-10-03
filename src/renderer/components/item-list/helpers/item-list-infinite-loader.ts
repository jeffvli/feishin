import { useQueryClient, useSuspenseQuery, UseSuspenseQueryOptions } from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { useMemo, useRef, useState } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';

export interface InfiniteListProps<TQuery> {
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    serverId: string;
}

interface UseItemListInfiniteLoaderProps {
    itemsPerPage: number;
    listCountQuery: UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;
    listQueryFn: (args: { apiClientProps: any; query: any }) => Promise<{ items: unknown[] }>;
    query: Record<string, any>;
    serverId: string;
}

function getInitialData(itemCount: number) {
    return Array.from({ length: itemCount }, () => undefined);
}

export const useItemListInfiniteLoader = ({
    itemsPerPage = 100,
    listCountQuery,
    listQueryFn,
    query = {},
    serverId,
}: UseItemListInfiniteLoaderProps) => {
    const queryClient = useQueryClient();

    const scrollStateRef = useRef<ScrollState>({
        direction: 'unknown',
        lastRange: null,
        lastScrollTime: 0,
    });

    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const pagesLoaded = useRef<Record<string, boolean>>({});

    const [data, setData] = useState<unknown[]>(getInitialData(totalItemCount));

    const onRangeChanged = useMemo(() => {
        return throttle(async (range: { endIndex: number; startIndex: number }) => {
            const fetchRange = getFetchRange(range, scrollStateRef, itemsPerPage);
            const startIndex = fetchRange.startIndex;
            const endIndex = fetchRange.startIndex + fetchRange.limit;

            const pageNumber = Math.floor(startIndex / itemsPerPage);

            if (pagesLoaded.current[pageNumber]) {
                return;
            }

            const queryParams = {
                limit: fetchRange.limit,
                startIndex: fetchRange.startIndex,
                ...query,
            };

            const result = await queryClient.ensureQueryData({
                gcTime: 1000 * 15,
                queryFn: async ({ signal }) => {
                    const result = await listQueryFn({
                        apiClientProps: { server: getServerById(serverId), signal },
                        query: queryParams,
                    });

                    return result.items;
                },
                queryKey: queryKeys.albums.list(serverId, queryParams),
                staleTime: 1000 * 15,
            });

            setData((oldData: any) => {
                return [...oldData.slice(0, startIndex), ...result, ...oldData.slice(endIndex)];
            });

            pagesLoaded.current[pageNumber] = true;
        }, 500);
    }, [itemsPerPage, queryClient, serverId, listQueryFn, query]);

    return { data, onRangeChanged };
};

export const parseListCountQuery = (query: any) => {
    return {
        ...query,
        limit: 1,
        startIndex: 0,
    };
};

interface ScrollState {
    direction: 'down' | 'unknown' | 'up';
    lastRange: null | { endIndex: number; startIndex: number };
    lastScrollTime: number;
}

const getFetchRange = (
    range: { endIndex: number; startIndex: number },
    scrollState: React.MutableRefObject<ScrollState>,
    itemsPerPage: number,
) => {
    const currentTime = Date.now();
    const { lastRange } = scrollState.current;

    // Determine scroll direction
    let newDirection: 'down' | 'unknown' | 'up' = 'unknown';
    if (lastRange) {
        if (range.startIndex < lastRange.startIndex) {
            newDirection = 'up';
        } else if (range.startIndex > lastRange.startIndex) {
            newDirection = 'down';
        }
    }

    scrollState.current = {
        direction: newDirection,
        lastRange: { ...range },
        lastScrollTime: currentTime,
    };

    let pageIndex = 0;
    if (newDirection === 'down') {
        pageIndex = Math.floor(range.endIndex / itemsPerPage);
    } else if (newDirection === 'up') {
        pageIndex = Math.floor(range.startIndex / itemsPerPage);
    } else {
        pageIndex = Math.floor(range.endIndex / itemsPerPage);
    }

    return {
        direction: newDirection,
        limit: itemsPerPage,
        startIndex: pageIndex * itemsPerPage,
    };
};
