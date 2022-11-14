import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { CreateServerFolderPermissionBody } from '@/renderer/api/servers.api';
import { ApiError, NullResponse } from '@/renderer/api/types';
import { UserListResponse } from '@/renderer/api/users.api';

export const useCreateServerFolderPermission = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    {
      body: CreateServerFolderPermissionBody;
      query: { folderId: string; serverId: string };
    },
    { previous: UserListResponse | undefined }
  >({
    mutationFn: ({ query, body }) =>
      api.servers.createServerFolderPermission(query, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(
        queryKeys.users.detail(variables.body.userId)
      );
    },
  });

  return mutation;
};
