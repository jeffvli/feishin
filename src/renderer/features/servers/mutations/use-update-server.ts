import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import {
  ServerResponse,
  ServerListResponse,
  CreateServerBody,
} from '@/renderer/api/servers.api';
import { ApiError } from '@/renderer/api/types';
import { toast } from '@/renderer/components';

export const useUpdateServer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ServerResponse,
    AxiosError<ApiError>,
    { body: Partial<CreateServerBody>; query: { serverId: string } },
    { previous: ServerListResponse | undefined }
  >({
    mutationFn: ({ query, body }) => api.servers.updateServer(query, body),
    onError: (err, _variables, context) => {
      toast.show({
        message: `${err.response?.data.error.message}`,
        type: 'error',
      });

      if (context?.previous) {
        queryClient.setQueryData(queryKeys.servers.list(), context.previous);
      }
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
            name: variables.body.name,
            username: variables.body.username,
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
    onSuccess: (data) => {
      toast.show({
        message: `Server "${data.data.name}" updated`,
        type: 'success',
      });
      queryClient.invalidateQueries(queryKeys.servers.list());
    },
  });

  return mutation;
};
