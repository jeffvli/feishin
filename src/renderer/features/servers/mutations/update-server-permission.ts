import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { UpdateServerPermissionBody } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useUpdateServerPermission = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    {
      body: UpdateServerPermissionBody;
      query: { permissionId: string; serverId: string };
      userId: string;
    },
    undefined
  >({
    mutationFn: ({ query, body }) =>
      api.servers.updateServerPermission(query, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(queryKeys.users.detail(variables.userId));
    },
  });

  return mutation;
};
