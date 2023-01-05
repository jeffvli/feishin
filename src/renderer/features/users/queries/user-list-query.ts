import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { RawUserListResponse, UserListQuery } from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import type { QueryOptions } from '/@/renderer/lib/react-query';

export const useUserList = (query: UserListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getUserList({ query, server, signal }),
    queryKey: queryKeys.users.list(server?.id || '', query),
    select: useCallback(
      (data: RawUserListResponse | undefined) => api.normalize.userList(data, server),
      [server],
    ),
    ...options,
  });
};
