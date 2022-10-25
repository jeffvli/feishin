import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';
import { toast } from '@/renderer/components';

export const useDeleteServerUrl = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    { query: { serverId: string; urlId: string } },
    { previous: ServerListResponse | undefined }
  >({
    mutationFn: ({ query }) => api.servers.deleteUrl(query),
    onError: (err, _variables, context) => {
      toast.show({
        message: `${err.response?.data?.error?.message || err.message}`,
        title: 'Failed to delete server URL',
        type: 'error',
      });

      if (!context?.previous) return;
      queryClient.setQueryData(queryKeys.servers.list(), context.previous);
    },
    onMutate: async (variables) => {
      const queryKey = queryKeys.servers.list();

      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData<ServerListResponse>(queryKey);

      if (!previous) return undefined;

      const data = previous.data.map((server) => {
        if (server.id === variables.query.serverId) {
          return {
            ...server,
            serverUrls: server.serverUrls?.filter(
              (url) => url.id !== variables.query.urlId
            ),
          };
        }

        return server;
      });

      queryClient.setQueryData(queryKey, { ...previous, data });

      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKeys.servers.list());
    },
  });

  return mutation;
};
