import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse, UrlResponse } from '@/renderer/api/servers.api';
import { ApiError } from '@/renderer/api/types';
import { toast } from '@/renderer/components';

export const useCreateServerUrl = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UrlResponse,
    AxiosError<ApiError>,
    {
      body: { url: string };
      query: { serverId: string };
    },
    { previous: ServerListResponse | undefined }
  >({
    mutationFn: ({ query, body }) => api.servers.createUrl(query, body),
    onError: (err) => {
      toast.show({
        message: `${err.response?.data?.error?.message || err.message}`,
        title: 'Failed to add server URL',
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKeys.servers.list());
    },
  });

  return mutation;
};
