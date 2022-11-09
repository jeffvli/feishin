import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError } from '@/renderer/api/types';
import { CreateUserBody, UserDetailResponse } from '@/renderer/api/users.api';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UserDetailResponse,
    AxiosError<ApiError>,
    { body: CreateUserBody },
    undefined
  >({
    mutationFn: ({ body }) => api.users.createUser(body),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.users.list());
    },
  });

  return mutation;
};
