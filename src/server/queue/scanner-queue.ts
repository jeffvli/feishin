import Queue from 'better-queue';
import { prisma } from '../lib';
import { Task } from '../types/types';

interface QueueTask {
  fn: any;
  id: string;
  task: Task;
}

// interface QueueResult {
//   completed?: boolean;
//   message?: string;
//   task: Task;
// }

export const q: Queue = new Queue(
  async (task: QueueTask, cb: any) => {
    const result = await task.fn();
    return cb(null, result);
  },
  {
    afterProcessDelay: 1000,
    cancelIfRunning: true,
    concurrent: 1,
    filo: false,
    maxRetries: 5,
    maxTimeout: 600000,
    retryDelay: 2000,
  }
);

// q.on('task_finish', async (_taskId, result: QueueResult) => {});

q.on('task_failed', async (taskId, errorMessage) => {
  const dbTaskId = taskId.split('(')[1].split(')')[0];
  await prisma.task.update({
    data: {
      completed: true,
      inProgress: false,
      isError: true,
      message: errorMessage,
    },
    where: { id: dbTaskId },
  });
});

q.on('drain', async () => {
  await prisma.task.updateMany({
    data: { completed: true, inProgress: false },
    where: {
      OR: [{ inProgress: true }, { completed: false }],
    },
  });
});

export const completeTask = async (task: Task) => {
  q.push({
    fn: async () => {
      await prisma.task.update({
        data: {
          completed: true,
          inProgress: false,
          message: 'Completed',
          progress: '',
        },
        where: { id: task.id },
      });

      return { task };
    },
    id: `${task.id}-complete`,
  });
};
