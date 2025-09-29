import { useQuery, useSuspenseQuery, UseSuspenseQueryOptions } from '@tanstack/react-query';

import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';

export interface PaginatedListProps<TQuery> {
    initialPage?: number;
    itemsPerPage?: number;
    query: Omit<TQuery, 'limit' | 'startIndex'>;
    serverId: string;
}

interface UseItemListPaginatedLoaderProps {
    currentPage: number;
    itemsPerPage: number;
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
    itemsPerPage = 100,
    listCountQuery,
    listQueryFn,
    query = {},
    serverId,
}: UseItemListPaginatedLoaderProps) => {
    const { data: totalItemCount } = useSuspenseQuery<number, any, number, any>(listCountQuery);

    const pageCount = Math.ceil(totalItemCount / itemsPerPage);

    const fetchRange = getFetchRange(currentPage, itemsPerPage);
    const startIndex = fetchRange.startIndex;

    const queryParams = {
        limit: itemsPerPage,
        startIndex: startIndex,
        ...query,
    };

    const { data } = useQuery({
        gcTime: 1000 * 15,
        placeholderData: getInitialData(itemsPerPage),
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

    return { data, pageCount, totalItemCount };
};

const getFetchRange = (pageIndex: number, itemsPerPage: number) => {
    const startIndex = pageIndex * itemsPerPage;

    return {
        limit: itemsPerPage,
        startIndex,
    };
};
