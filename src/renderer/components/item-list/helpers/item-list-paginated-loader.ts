import {
    useMutation,
    useQuery,
    useQueryClient,
    useSuspenseQuery,
    UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { useListContext } from '/@/renderer/context/list-context';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { UserFavoriteEventPayload, UserRatingEventPayload } from '/@/renderer/events/events';
import { getListRefreshMutationKey } from '/@/renderer/features/shared/components/list-refresh-button';
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
            return 'albums'; // fallback
    }
};

interface UseItemListPaginatedLoaderProps {
    currentPage: number;
    eventKey?: string;
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

export const useItemListPaginatedLoader = ({
    currentPage,
    eventKey,
    itemsPerPage = 100,
    itemType,
    listCountQuery,
    listQueryFn,
    query = {},
    serverId,
}: UseItemListPaginatedLoaderProps) => {
    const queryClient = useQueryClient();
    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const { setItemCount } = useListContext();

    useEffect(() => {
        if (totalItemCount == null || !setItemCount) {
            return;
        }

        setItemCount(totalItemCount);
    }, [setItemCount, totalItemCount]);

    const pageCount = Math.ceil(totalItemCount / itemsPerPage);

    const fetchRange = getFetchRange(currentPage, itemsPerPage);
    const startIndex = fetchRange.startIndex;

    const queryParams = useMemo(
        () => ({
            limit: itemsPerPage,
            startIndex: startIndex,
            ...query,
        }),
        [itemsPerPage, startIndex, query],
    );

    const { data } = useQuery({
        gcTime: 1000 * 15,
        placeholderData: { items: getInitialData(itemsPerPage) },
        queryFn: async ({ signal }) => {
            const result = await listQueryFn({
                apiClientProps: { serverId, signal },
                query: queryParams,
            });

            return result;
        },
        queryKey: queryKeys[getQueryKeyName(itemType)].list(serverId, queryParams),
        staleTime: 1000 * 15,
    });

    const refreshMutation = useMutation({
        mutationFn: async (force?: boolean) => {
            const queryKey = queryKeys[getQueryKeyName(itemType)].list(serverId, queryParams);

            if (force) {
                queryClient.setQueryData(queryKey, {
                    items: getInitialData(itemsPerPage),
                });
            }

            await queryClient.invalidateQueries();
        },
        mutationKey: getListRefreshMutationKey(eventKey ?? 'paginated'),
    });

    const updateItems = useCallback(
        (indexes: number[], value: object) => {
            return queryClient.setQueryData(
                queryKeys[getQueryKeyName(itemType)].list(serverId, queryParams),
                (prev: undefined | { items: unknown[] }) => {
                    if (!prev) {
                        return prev;
                    }

                    return {
                        ...prev,
                        items: prev.items.map((item: any, index) => {
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
        [queryClient, queryParams, serverId, itemType],
    );

    useEffect(() => {
        const handleRefresh = (payload: { key: string }) => {
            if (!eventKey || eventKey !== payload.key) {
                return;
            }

            refreshMutation.mutate(true);
        };

        const handleFavorite = (payload: UserFavoriteEventPayload) => {
            if (!data || !data.items) {
                return;
            }

            if (payload.itemType !== itemType || payload.serverId !== serverId) {
                return;
            }

            const idToIndexMap = data.items
                .filter(Boolean)
                .reduce((acc: Record<string, number>, item: any, index: number) => {
                    acc[item.id] = index;
                    return acc;
                }, {});

            const dataIndexes = payload.id
                .map((id: string) => idToIndexMap[id])
                .filter((idx) => idx !== undefined);

            if (dataIndexes.length === 0) {
                return;
            }

            return updateItems(dataIndexes, { userFavorite: payload.favorite });
        };

        const handleRating = (payload: UserRatingEventPayload) => {
            if (!data || !data.items) {
                return;
            }

            if (payload.itemType !== itemType || payload.serverId !== serverId) {
                return;
            }

            const idToIndexMap = data.items.reduce(
                (acc: Record<string, number>, item: any, index: number) => {
                    acc[item.id] = index;
                    return acc;
                },
                {},
            );

            const dataIndexes = payload.id
                .map((id: string) => idToIndexMap[id])
                .filter((idx) => idx !== undefined);

            if (dataIndexes.length === 0) {
                return;
            }

            return updateItems(dataIndexes, { userRating: payload.rating });
        };

        eventEmitter.on('ITEM_LIST_REFRESH', handleRefresh);
        eventEmitter.on('USER_FAVORITE', handleFavorite);
        eventEmitter.on('USER_RATING', handleRating);

        return () => {
            eventEmitter.off('ITEM_LIST_REFRESH', handleRefresh);
            eventEmitter.off('USER_FAVORITE', handleFavorite);
            eventEmitter.off('USER_RATING', handleRating);
        };
    }, [data, eventKey, itemType, refreshMutation, serverId, updateItems]);

    return { data: data?.items || [], pageCount, totalItemCount };
};

const getFetchRange = (pageIndex: number, itemsPerPage: number) => {
    const startIndex = pageIndex * itemsPerPage;

    return {
        limit: itemsPerPage,
        startIndex,
    };
};
