import { QueryClient } from '@tanstack/react-query';

import { getServerById } from '/@/renderer/store';
import { ServerType } from '/@/shared/types/domain-types';

interface OptimizedListCountOptions<TQuery, TListQuery, TResponse> {
    client: QueryClient;
    listQueryFn: (args: {
        apiClientProps: { serverId: string; signal?: AbortSignal };
        query: TListQuery;
    }) => Promise<TResponse>;
    listQueryKeyFn: (serverId: string, query: TListQuery) => readonly unknown[];
    query: TQuery;
    serverId: string;
    signal?: AbortSignal;
}

export const getOptimizedListCount = async <
    TQuery,
    TListQuery extends { limit?: number; startIndex?: number },
    TResponse extends { totalRecordCount: null | number },
>({
    client,
    listQueryFn,
    listQueryKeyFn,
    query,
    serverId,
    signal,
}: OptimizedListCountOptions<TQuery, TListQuery, TResponse>): Promise<null | number> => {
    const server = getServerById(serverId);

    if (server?.type !== ServerType.NAVIDROME && server?.type !== ServerType.JELLYFIN) {
        return null;
    }

    const limit =
        typeof query === 'object' &&
        query !== null &&
        'limit' in query &&
        typeof (query as any).limit === 'number' &&
        (query as any).limit > 0
            ? (query as any).limit
            : 100;

    // In most cases, the list count is called when entering the first page, so we fetch from the first page
    // This optimization will only help in this case, otherwise we still need 2 requests to get both the count and the data
    const pageQuery = {
        ...query,
        limit,
        startIndex: 0,
    } as unknown as TListQuery;

    const pageQueryKey = listQueryKeyFn(serverId, pageQuery);
    const cachedPage = client.getQueryData(pageQueryKey);

    if (cachedPage && typeof cachedPage === 'object' && 'totalRecordCount' in cachedPage) {
        return (cachedPage as TResponse).totalRecordCount ?? 0;
    }

    const pageResult = await listQueryFn({
        apiClientProps: { serverId, signal },
        query: pageQuery,
    });

    const keyContainsRandom = JSON.stringify(pageQueryKey).toLowerCase().includes('random');

    if (!keyContainsRandom) {
        client.setQueryData(pageQueryKey, pageResult);
    }

    return pageResult.totalRecordCount ?? 0;
};
