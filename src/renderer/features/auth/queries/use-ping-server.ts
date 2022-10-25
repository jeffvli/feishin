import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';

export const usePingServer = (server: string) => {
  return useQuery({
    enabled: !!server,
    queryFn: () => api.auth.ping(server),
    queryKey: queryKeys.ping(server),
    retry: false,
  });
};
