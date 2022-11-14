import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError, NullResponse } from '@/renderer/api/types';

export const useDeleteServerFolderPermission = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    {
      query: { folderId: string; folderPermissionId: string; serverId: string };
      userId: string;
    },
    undefined
  >({
    mutationFn: ({ query }) => api.servers.deleteServerFolderPermission(query),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(queryKeys.users.detail(variables.userId));
    },
  });

  return mutation;
};
