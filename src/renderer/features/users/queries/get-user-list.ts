import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';
import { getFileUrl } from '@/renderer/utils';

export const useUserList = (options?: QueryOptions) => {
  const serverUrl = useAuthStore((state) => state.serverUrl);

  const query = useQuery({
    queryFn: () => api.users.getUserList(),
    queryKey: queryKeys.users.list(),
    select: (data) => {
      const users = data.data.map((user) => ({
        ...user,
        avatarUrl: getFileUrl(serverUrl, user?.avatar),
      }));

      return { ...data, data: users };
    },
    ...options,
  });

  return query;
};
