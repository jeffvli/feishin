import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { UserListResponse } from '@/renderer/api/users.api';
import { QueryOptions } from '@/renderer/lib/react-query';

export const useUserList = (options?: QueryOptions<UserListResponse>) => {
  const query = useQuery({
    queryFn: () => api.users.getUserList(),
    queryKey: queryKeys.users.list(),
    ...options,
  });

  return query;
};
