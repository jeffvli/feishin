import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useDisableServerFolder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    { query: { folderId: string; serverId: string } },
    { previous: ServerListResponse | undefined }
  >({
    mutationFn: ({ query }) => api.servers.disableFolder(query),
    onError: (_err, _variables, context) => {
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
            serverFolders: server.serverFolders?.map((folder) =>
              folder.id === variables.query.folderId
                ? { ...folder, enabled: false }
                : folder
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
