import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerMapResponse } from '@/renderer/api/servers.api';
import { QueryOptions } from '@/renderer/lib/react-query';

export const useServerMap = (options?: QueryOptions<ServerMapResponse>) => {
  return useQuery<ServerMapResponse>({
    cacheTime: Infinity,
    queryFn: ({ signal }) => api.servers.getServerMap(signal),
    queryKey: queryKeys.servers.map(),
    staleTime: Infinity,
    ...options,
  });
};
