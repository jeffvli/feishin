import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { TaskListResponse, TaskResponse } from '@/renderer/api/tasks.api';
import { ApiError } from '@/renderer/api/types';

export const useCancelTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    TaskResponse,
    AxiosError<ApiError>,
    { query: { taskId: string } },
    { previous: TaskListResponse | undefined }
  >({
    mutationFn: ({ query }) => api.tasks.cancelTask(query),
    onError: (_err, _variables, context) => {
      if (!context?.previous) return;
      queryClient.setQueryData(queryKeys.servers.list(), context.previous);
    },
    onMutate: () => {
      const queryKey = queryKeys.tasks.list();
      queryClient.cancelQueries(queryKey);
      const previous = queryClient.getQueryData<TaskListResponse>(queryKey);

      if (!previous) return undefined;

      queryClient.setQueryData(queryKey, { ...previous, data: [] });

      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.tasks.list());
    },
  });

  return mutation;
};
