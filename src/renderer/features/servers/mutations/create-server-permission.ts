import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { CreateServerPermissionBody } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useCreateServerPermission = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    {
      body: CreateServerPermissionBody;
      query: { serverId: string };
    },
    undefined
  >({
    mutationFn: ({ query, body }) =>
      api.servers.createServerPermission(query, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(
        queryKeys.users.detail(variables.body.userId)
      );
    },
  });

  return mutation;
};
