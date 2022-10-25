import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { CreateServerBody, ServerResponse } from '@/renderer/api/servers.api';
import { ApiError } from '@/renderer/api/types';
import { toast } from '@/renderer/components';

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ServerResponse,
    AxiosError<ApiError>,
    { body: CreateServerBody },
    null
  >({
    mutationFn: ({ body }) => api.servers.createServer(body),
    onError: (err: any) => {
      toast.show({
        message: `${err.response?.data?.error?.message || err.message}`,
        title: 'Failed to add server',
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKeys.servers.list());
    },
    onSuccess: (data) => {
      toast.show({
        message: `${data.data.name} was added successfully`,
        title: 'Server added',
        type: 'success',
      });
    },
  });
};
