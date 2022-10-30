import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { TaskListResponse } from '@/renderer/api/tasks.api';
import { QueryOptions } from '@/renderer/lib/react-query';

export const useTaskList = (options?: QueryOptions<TaskListResponse>) => {
  return useQuery({
    queryFn: ({ signal }) => api.tasks.getActiveTasks(signal),
    queryKey: queryKeys.tasks.list(),
    select: useCallback((data: TaskListResponse) => {
      return {
        ...data,
        data: data.data.map((task) => {
          return { ...task, note: `${task.server?.name} - ${task.message}` };
        }),
      };
    }, []),
    ...options,
  });
};
