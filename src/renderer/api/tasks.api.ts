import { BaseResponse, NullResponse, Task } from '@/renderer/api/types';
import { ax } from '@/renderer/lib/axios';

export type TaskListResponse = BaseResponse<Task[]>;

const getActiveTasks = async (signal?: AbortSignal) => {
  const { data } = await ax.get<TaskListResponse>('/tasks', {
    signal,
  });

  return data;
};

const cancelAllTasks = async () => {
  const { data } = await ax.post<NullResponse>('/tasks/cancel', {});

  return data;
};

export type TaskResponse = BaseResponse<Task>;

const cancelTask = async (query: { taskId: string }) => {
  const { data } = await ax.post<TaskResponse>(
    `/tasks/${query.taskId}/cancel`,
    {}
  );

  return data;
};

export const tasksApi = {
  cancelAllTasks,
  cancelTask,
  getActiveTasks,
};
