import {
    useQuery,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { useListContext } from '/@/renderer/context/list-context';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { getServerById } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface UseItemListInfiniteLoaderProps {
    eventKey: string;
    itemsPerPage: number;
    itemType: LibraryItem;
    listCountQuery: UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;
    listQueryFn: (args: { apiClientProps: any; query: any }) => Promise<{ items: unknown[] }>;
    query: Record<string, any>;
    serverId: string;
}

function getInitialData(itemCount: number) {
    return Array.from({ length: itemCount }, () => undefined);
}

export const useItemListInfiniteLoader = ({
    eventKey,
    itemsPerPage = 100,
    itemType,
    listCountQuery,
    listQueryFn,
    query = {},
    serverId,
}: UseItemListInfiniteLoaderProps) => {
    const queryClient = useQueryClient();

    const currentPageRef = useRef(0);

    const scrollStateRef = useRef<ScrollState>({
        direction: 'unknown',
        lastRange: null,
        lastScrollTime: 0,
    });

    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const { setItemCount } = useListContext();

    useEffect(() => {
        if (!totalItemCount || !setItemCount) {
            return;
        }

        setItemCount(totalItemCount);
    }, [setItemCount, totalItemCount]);

    const pagesLoaded = useRef<Record<string, boolean>>({});

    // Reset the loaded pages when the query changes
    useEffect(() => {
        pagesLoaded.current = {};
    }, [query]);

    const dataQueryKey = useMemo(
        () => [serverId, 'item-list-infinite-loader', itemType, query],
        [serverId, itemType, query],
    );

    const { data } = useQuery<unknown[]>({
        enabled: false,
        initialData: getInitialData(totalItemCount),
        queryFn: () => {
            return getInitialData(totalItemCount);
        },
        queryKey: dataQueryKey,
    });

    const onRangeChanged = useMemo(() => {
        return throttle(async (range: { endIndex: number; startIndex: number }) => {
            const fetchRange = getFetchRange(range, scrollStateRef, itemsPerPage);
            const startIndex = fetchRange.startIndex;
            const endIndex = fetchRange.startIndex + fetchRange.limit;

            const pageNumber = Math.floor(startIndex / itemsPerPage);

            if (pagesLoaded.current[pageNumber]) {
                return;
            }

            currentPageRef.current = pageNumber;

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

            queryClient.setQueryData(dataQueryKey, (oldData: unknown[]) => {
                return [...oldData.slice(0, startIndex), ...result, ...oldData.slice(endIndex)];
            });

            pagesLoaded.current[pageNumber] = true;
        }, 500);
    }, [itemsPerPage, query, queryClient, serverId, dataQueryKey, listQueryFn]);

    const refresh = useCallback(
        async (force?: boolean) => {
            await queryClient.invalidateQueries();
            pagesLoaded.current = {};

            if (force) {
                await queryClient.setQueryData(dataQueryKey, getInitialData(totalItemCount));
            }

            await onRangeChanged({
                endIndex: currentPageRef.current * itemsPerPage,
                startIndex: currentPageRef.current * itemsPerPage,
            });
        },
        [itemsPerPage, onRangeChanged, queryClient, totalItemCount, dataQueryKey],
    );

    const updateItems = useCallback(
        (indexes: number[], value: object) => {
            queryClient.setQueryData(dataQueryKey, (prev: unknown[]) => {
                return prev.map((item: any, index) => {
                    if (!item) {
                        return item;
                    }

                    if (!indexes.includes(index)) {
                        return item;
                    }

                    return {
                        ...item,
                        ...value,
                    };
                });
            });
        },
        [queryClient, dataQueryKey],
    );

    useEffect(() => {
        const handleRefresh = (payload: { key: string }) => {
            if (!eventKey || eventKey !== payload.key) {
                return;
            }

            return refresh(true);
        };

        eventEmitter.on('ITEM_LIST_REFRESH', handleRefresh);

        return () => {
            eventEmitter.off('ITEM_LIST_REFRESH', handleRefresh);
        };
    }, [eventKey, refresh]);

    useEffect(() => {
        const handleFavorite = (payload: UserFavoriteEventPayload) => {
            const idToIndexMap = data
                .filter(Boolean)
                .reduce((acc: Record<string, number>, item: any, index: number) => {
                    acc[item.id] = index;
                    return acc;
                }, {});

            const dataIndexes = payload.id.map((id: string) => idToIndexMap[id]);

            if (dataIndexes.length === 0) {
                return;
            }

            return updateItems(dataIndexes, { userFavorite: payload.favorite });
        };

        const handleRating = (payload: UserRatingEventPayload) => {
            const idToIndexMap = data
                .filter(Boolean)
                .reduce((acc: Record<string, number>, item: any, index: number) => {
                    acc[item.id] = index;
                    return acc;
                }, {});

            const dataIndexes = payload.id.map((id: string) => idToIndexMap[id]);

            if (dataIndexes.length === 0) {
                return;
            }

            return updateItems(dataIndexes, { userRating: payload.rating });
        };

        eventEmitter.on('USER_FAVORITE', handleFavorite);
        eventEmitter.on('USER_RATING', handleRating);

        return () => {
            eventEmitter.off('USER_FAVORITE', handleFavorite);
            eventEmitter.off('USER_RATING', handleRating);
        };
    }, [data, eventKey, updateItems]);

    return { data, onRangeChanged, refresh, updateItems };
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
