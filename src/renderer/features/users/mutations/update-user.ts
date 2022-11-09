import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError } from '@/renderer/api/types';
import {
  UpdateUserBody,
  UserDetailResponse,
  UserListResponse,
} from '@/renderer/api/users.api';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UserDetailResponse,
    AxiosError<ApiError>,
    { body: UpdateUserBody; query: { userId: string } },
    { previous: UserListResponse | undefined }
  >({
    mutationFn: ({ query, body }) => api.users.updateUser(query, body),
    onMutate: async (variables) => {
      const queryKey = queryKeys.users.list();

      await queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData<UserListResponse>(queryKey);

      if (!previous) return undefined;

      const data = previous.data.map((user) => {
        if (user.id !== variables.query.userId) return user;
        return { ...user, username: variables.body.username };
      });

      queryClient.setQueryData(queryKey, { ...previous, data });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.users.list());
    },
  });

  return mutation;
};
