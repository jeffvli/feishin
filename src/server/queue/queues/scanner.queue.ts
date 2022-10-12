import { Task } from '@prisma/client';
import Queue from 'better-queue';
import { prisma } from '../../lib';

interface QueueTask {
  fn: any;
  id: string;
  task: Task;
}

export const scannerQueue: Queue = new Queue(
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

scannerQueue.on('task_finish', async (taskId) => {
  await prisma.task.update({
    data: {
      completed: true,
      isError: false,
      progress: null,
    },
    where: { id: taskId },
  });
});

scannerQueue.on('task_failed', async (taskId, errorMessage) => {
  const dbTaskId = taskId.split('(')[1].split(')')[0];

  console.log('errorMessage', errorMessage);
  await prisma.task.update({
    data: {
      completed: true,
      isError: true,
      message: errorMessage,
    },
    where: { id: dbTaskId },
  });
});

scannerQueue.on('drain', async () => {
  await prisma.task.updateMany({
    data: { completed: true, progress: null },
    where: { completed: false },
  });
});
