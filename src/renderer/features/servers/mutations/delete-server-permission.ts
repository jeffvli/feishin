import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useDeleteServerPermission = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    { query: { permissionId: string; serverId: string }; userId: string },
    undefined
  >({
    mutationFn: ({ query }) => api.servers.deleteServerPermission(query),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(queryKeys.users.detail(variables.userId));
    },
  });

  return mutation;
};
