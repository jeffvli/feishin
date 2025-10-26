import {
    useQuery,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { useListContext } from '/@/renderer/context/list-context';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { getServerById } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

const getQueryKeyName = (itemType: LibraryItem): string => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return 'albums';
        case LibraryItem.ALBUM_ARTIST:
            return 'albumArtists';
        case LibraryItem.ARTIST:
            return 'artists';
        case LibraryItem.GENRE:
            return 'genres';
        case LibraryItem.PLAYLIST:
            return 'playlists';
        case LibraryItem.SONG:
            return 'songs';
        default:
            return 'albums';
    }
};

interface UseItemListInfiniteLoaderProps {
    eventKey: string;
    fetchThreshold?: number;
    itemsPerPage: number;
    itemType: LibraryItem;
    listCountQuery: UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;
    listQueryFn: (args: { apiClientProps: any; query: any }) => Promise<{ items: unknown[] }>;
    maxPagesToFetch?: number;
    query: Record<string, any>;
    serverId: string;
}

function getInitialData(itemCount: number) {
    return {
        data: Array.from({ length: itemCount }, () => undefined),
        pagesLoaded: {},
    };
}

export const useItemListInfiniteLoader = ({
    eventKey,
    fetchThreshold = 0.75,
    itemsPerPage = 100,
    itemType,
    listCountQuery,
    listQueryFn,
    maxPagesToFetch = 2,
    query = {},
    serverId,
}: UseItemListInfiniteLoaderProps) => {
    const queryClient = useQueryClient();

    const scrollStateRef = useRef<ScrollState>({
        direction: 'unknown',
        lastStartIndex: null,
    });

    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const { setItemCount } = useListContext();

    useEffect(() => {
        if (!totalItemCount || !setItemCount) {
            return;
        }

        setItemCount(totalItemCount);
    }, [setItemCount, totalItemCount]);

    const dataQueryKey = useMemo(
        () => [serverId, 'item-list-infinite-loader', itemType, query],
        [serverId, itemType, query],
    );

    // Reset the loaded pages when the query changes
    useEffect(() => {
        queryClient.setQueryData(dataQueryKey, (oldData: any) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pagesLoaded: {},
            };
        });
    }, [query, queryClient, dataQueryKey]);

    const { data } = useQuery<{ data: unknown[]; pagesLoaded: Record<string, boolean> }>({
        enabled: false,
        initialData: getInitialData(totalItemCount),
        queryFn: () => {
            return getInitialData(totalItemCount);
        },
        queryKey: dataQueryKey,
    });

    const onRangeChanged = useMemo(() => {
        return async (range: { startIndex: number; stopIndex: number }) => {
            const fetchRange = getFetchRange(
                range,
                scrollStateRef,
                itemsPerPage,
                maxPagesToFetch,
                fetchThreshold,
            );

            // Filter out pages that are already loaded
            const pagesToFetch = fetchRange.pagesToFetch.filter(
                (pageNumber) => !data.pagesLoaded[pageNumber],
            );

            if (pagesToFetch.length === 0) {
                return;
            }

            // Create fetch promises for all pages
            const fetchPromises = pagesToFetch.map(async (pageNumber) => {
                const startIndex = pageNumber * itemsPerPage;
                const queryParams = {
                    limit: itemsPerPage,
                    startIndex,
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
                    queryKey: queryKeys[getQueryKeyName(itemType)].list(serverId, queryParams),
                    staleTime: 1000 * 15,
                });

                return {
                    data: result,
                    endIndex: startIndex + itemsPerPage,
                    pageNumber,
                    startIndex,
                };
            });

            // Wait for all pages to be fetched
            const pageResults = await Promise.all(fetchPromises);

            // Update the query data with all fetched pages
            queryClient.setQueryData(
                dataQueryKey,
                (oldData: { data: unknown[]; pagesLoaded: Record<string, boolean> }) => {
                    let newData = [...oldData.data];
                    const newPagesLoaded = { ...oldData.pagesLoaded };

                    // Update data for each fetched page
                    pageResults.forEach(({ data: pageData, endIndex, pageNumber, startIndex }) => {
                        newData = [
                            ...newData.slice(0, startIndex),
                            ...pageData,
                            ...newData.slice(endIndex),
                        ];
                        newPagesLoaded[pageNumber] = true;
                    });

                    return {
                        data: newData,
                        pagesLoaded: newPagesLoaded,
                    };
                },
            );
        };
    }, [
        itemsPerPage,
        query,
        queryClient,
        serverId,
        dataQueryKey,
        listQueryFn,
        itemType,
        data,
        maxPagesToFetch,
        fetchThreshold,
    ]);

    const refresh = useCallback(
        async (force?: boolean) => {
            await queryClient.invalidateQueries();

            if (force) {
                await queryClient.setQueryData(dataQueryKey, getInitialData(totalItemCount));
            }

            // await onRangeChanged({
            //     endIndex: currentPageRef.current * itemsPerPage,
            //     startIndex: currentPageRef.current * itemsPerPage,
            // });
        },
        [queryClient, totalItemCount, dataQueryKey],
    );

    const updateItems = useCallback(
        (indexes: number[], value: object) => {
            queryClient.setQueryData(
                dataQueryKey,
                (prev: { data: unknown[]; pagesLoaded: Record<string, boolean> }) => {
                    return {
                        ...prev,
                        data: prev.data.map((item: any, index) => {
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
                        }),
                    };
                },
            );
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
            const idToIndexMap = data.data
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
            const idToIndexMap = data.data
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

    return { data: data.data, onRangeChanged, refresh, updateItems };
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
    lastStartIndex: null | number;
}

const getFetchRange = (
    range: { startIndex: number; stopIndex: number },
    scrollState: React.MutableRefObject<ScrollState>,
    itemsPerPage: number,
    maxPagesToFetch: number,
    fetchThreshold: number,
) => {
    const { lastStartIndex } = scrollState.current;

    // Determine scroll direction
    let newDirection: 'down' | 'unknown' | 'up' = scrollState.current.direction;
    if (lastStartIndex !== null) {
        if (range.startIndex < lastStartIndex) {
            newDirection = 'up';
        } else if (range.startIndex > lastStartIndex) {
            newDirection = 'down';
        }
    }

    scrollState.current = {
        direction: newDirection,
        lastStartIndex: range.startIndex,
    };

    // Calculate threshold distance
    const thresholdDistance = Math.floor(itemsPerPage * fetchThreshold);

    // Determine which pages to fetch based on scroll direction and threshold
    let pagesToFetch: number[] = [];

    if (newDirection === 'down') {
        const currentPage = Math.floor(range.stopIndex / itemsPerPage);
        const distanceFromNextPage = (currentPage + 1) * itemsPerPage - range.stopIndex;

        // Always include the current page if it's not loaded
        pagesToFetch.push(currentPage);

        // If we're close to the next page boundary, fetch additional upcoming pages
        if (distanceFromNextPage <= thresholdDistance && maxPagesToFetch > 1) {
            for (let i = 1; i < maxPagesToFetch; i++) {
                pagesToFetch.push(currentPage + i);
            }
        }
    } else if (newDirection === 'up') {
        const currentPage = Math.floor(range.startIndex / itemsPerPage);
        const distanceFromPrevPage = range.startIndex - currentPage * itemsPerPage;

        // Always include the current page if it's not loaded
        pagesToFetch.push(currentPage);

        // If we're close to the previous page boundary, fetch additional previous pages
        if (distanceFromPrevPage <= thresholdDistance && maxPagesToFetch > 1) {
            for (let i = 1; i < maxPagesToFetch; i++) {
                pagesToFetch.push(currentPage - i);
            }
        }
    } else {
        // Unknown direction - fetch current page and next pages
        const currentPage = Math.floor(range.stopIndex / itemsPerPage);
        for (let i = 0; i < maxPagesToFetch; i++) {
            pagesToFetch.push(currentPage + i);
        }
    }

    // Filter out negative page numbers
    pagesToFetch = pagesToFetch.filter((page) => page >= 0);

    return {
        direction: newDirection,
        pagesToFetch,
        thresholdDistance,
    };
};
