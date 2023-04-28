import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { UserListQuery } from '/@/renderer/api/types';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';

export const useUserList = (args: QueryHookArgs<UserListQuery>) => {
  const { query, serverId, options } = args || {};
  const server = getServerById(serverId);

  return useQuery({
    enabled: !!server,
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      api.controller.getUserList({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.users.list(server?.id || '', query),
    ...options,
  });
};
