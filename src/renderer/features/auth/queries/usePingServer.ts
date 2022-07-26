import { useQuery } from 'react-query';
import { authApi } from 'renderer/api/authApi';
import { queryKeys } from 'renderer/api/queryKeys';

export const usePingServer = (server: string) => {
  return useQuery({
    enabled: !!server,
    queryFn: () => authApi.ping(server),
    queryKey: queryKeys.ping(server),
    retry: false,
  });
};
