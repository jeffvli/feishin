import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { SearchQuery } from '/@/shared/types/domain-types';

export const searchQueries = {
    search: (args: QueryHookArgs<SearchQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.search({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.search.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
};
