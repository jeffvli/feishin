import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useQuickScan = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    {
      body: { serverFolderId?: string[] };
      query: { serverId: string };
    },
    { previous: ServerListResponse | undefined }
  >({
    mutationFn: ({ body, query }) => api.servers.quickScan({ body, query }),
    onError: (_err, _variables, context) => {
      if (!context?.previous) return;
      queryClient.setQueryData(queryKeys.servers.list(), context.previous);
    },
    onMutate: async () => {
      const queryKey = queryKeys.servers.list();

      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData<ServerListResponse>(queryKey);

      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKeys.servers.list());
    },
  });

  return mutation;
};
