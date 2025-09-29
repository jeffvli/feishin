import { useQuery, useSuspenseQuery, UseSuspenseQueryOptions } from '@tanstack/react-query';

import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';

export interface PaginatedListProps<TQuery> {
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    serverId: string;
}

interface UseItemListPaginatedLoaderProps {
    itemsPerPage: number;
    listCountQuery: UseSuspenseQueryOptions<number, Error, number, readonly unknown[]>;
    listQueryFn: (args: { apiClientProps: any; query: any }) => Promise<{ items: unknown[] }>;
    pageIndex: number;
    query: Record<string, any>;
    serverId: string;
}

function getInitialData(itemCount: number) {
    return Array.from({ length: itemCount }, () => undefined);
}

export const useItemListPaginatedLoader = ({
    itemsPerPage = 100,
    listCountQuery,
    listQueryFn,
    pageIndex,
    query = {},
    serverId,
}: UseItemListPaginatedLoaderProps) => {
    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const { data } = useQuery({
        gcTime: 1000 * 15,
        initialData: getInitialData(totalItemCount),
        queryFn: async ({ signal }) => {
            const fetchRange = getFetchRange(pageIndex, itemsPerPage);
            const startIndex = fetchRange.startIndex;

            const queryParams = {
                limit: itemsPerPage,
                startIndex: startIndex,
                ...query,
            };

            const result = await listQueryFn({
                apiClientProps: { server: getServerById(serverId), signal },
                query: queryParams,
            });

            return result.items;
        },
        queryKey: queryKeys.albums.list(serverId, query),
        staleTime: 1000 * 15,
    });

    return { data };
};

const getFetchRange = (pageIndex: number, itemsPerPage: number) => {
    const startIndex = pageIndex * itemsPerPage;

    return {
        limit: itemsPerPage,
        startIndex,
    };
};
