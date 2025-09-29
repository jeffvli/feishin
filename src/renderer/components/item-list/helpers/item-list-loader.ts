import {
    useQueryClient,
    UseQueryOptions,
    useSuspenseQuery,
    UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { useMemo, useRef, useState } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

export interface InfiniteListProps<TQuery> {
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    serverId: string;
}

interface UseItemListInfiniteLoaderProps {
    itemsPerPage: number;
    itemType: LibraryItem;
    listCountQuery: UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;
    listQuery: UseQueryOptions<any, Error, any, readonly unknown[]>;
    params: Record<string, any>;
    serverId: string;
}

function getInitialData(itemCount: number) {
    return Array.from({ length: itemCount }, () => undefined);
}

export const useItemListInfiniteLoader = ({
    itemsPerPage = 50, // Default items per page
    itemType,
    listCountQuery,
    listQuery,
    params = {},
    serverId,
}: UseItemListInfiniteLoaderProps) => {
    const queryClient = useQueryClient();

    // Scroll state management
    const scrollStateRef = useRef<ScrollState>({
        direction: 'unknown',
        lastRange: null,
        lastScrollTime: 0,
    });

    const { data: totalItemCount } = useSuspenseQuery<any, any, any, any>(listCountQuery);

    const [data, setData] = useState<any>(getInitialData(totalItemCount));

    const onRangeChanged = useMemo(() => {
        return throttle(async (range: { endIndex: number; startIndex: number }) => {
            const fetchRange = getFetchRange(range, scrollStateRef, itemsPerPage);
            const startIndex = fetchRange.startIndex;
            const endIndex = fetchRange.startIndex + fetchRange.limit;

            const query = {
                limit: fetchRange.limit,
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: fetchRange.startIndex,
            };

            // Check if data exists in cache and is fresh
            const queryState = queryClient.getQueryState(queryKeys.albums.list(serverId, query));

            if (!queryState || queryState.isInvalidated) {
                const result = await queryClient.fetchQuery({
                    gcTime: 1000 * 30,
                    queryFn: async ({ signal }) => {
                        const result = await api.controller.getAlbumList({
                            apiClientProps: {
                                server: getServerById(serverId),
                                signal,
                            },
                            query,
                        });

                        return result.items;
                    },
                    queryKey: queryKeys.albums.list(serverId, query),
                    staleTime: 1000 * 30,
                });

                // Only run setData if we actually fetched fresh data
                setData((oldData: any) => {
                    return [...oldData.slice(0, startIndex), ...result, ...oldData.slice(endIndex)];
                });
            }
        }, 50);
    }, [itemsPerPage, queryClient, serverId]);

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
