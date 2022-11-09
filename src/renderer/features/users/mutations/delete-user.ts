import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError, NullResponse } from '@/renderer/api/types';
import { UserListResponse } from '@/renderer/api/users.api';

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    NullResponse,
    AxiosError<ApiError>,
    { query: { userId: string } },
    { previous: UserListResponse | undefined }
  >({
    mutationFn: ({ query }) => api.users.deleteUser({ userId: query.userId }),
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users.list(), context.previous);
      }
    },
    onMutate: async (variables) => {
      const queryKey = queryKeys.users.list();

      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData<UserListResponse>(queryKey);

      if (!previous) return undefined;

      const data = previous.data.filter(
        (user) => user.id !== variables.query.userId
      );

      queryClient.setQueryData(queryKey, { ...previous, data });

      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKeys.users.list());
    },
  });

  return mutation;
};
