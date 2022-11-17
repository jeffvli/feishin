import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';

export const useServerList = (
  params?: { enabled?: boolean },
  options?: QueryOptions
) => {
  const currentServer = useAuthStore((state) => state.currentServer);
  const setCurrentServer = useAuthStore((state) => state.setCurrentServer);

  return useQuery({
    onSettled: (data: ServerListResponse) => {
      const currentServerFromList = data?.data.find(
        (server) => server.id === currentServer?.id
      );

      if (!currentServerFromList) {
        return setCurrentServer(null);
      }

      return setCurrentServer(currentServerFromList);
    },
    queryFn: () => api.servers.getServerList(params),
    queryKey: queryKeys.servers.list(params),
    ...options,
  });
};
