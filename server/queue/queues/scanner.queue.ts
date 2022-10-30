import { Task } from '@prisma/client';
import Queue from 'better-queue';
import { prisma } from '../../lib';

interface QueueTask {
  fn: any;
  id: string;
  task: Task;
}

export const scannerQueue: Queue | any = new Queue(
  async (task: QueueTask, cb: any) => {
    const result = await task.fn();
    return cb(null, result);
  },
  {
    afterProcessDelay: 1000,
    cancelIfRunning: true,
    concurrent: 1,
    filo: false,
  }
);

scannerQueue.on('task_finish', async (taskId: string) => {
  await prisma.task.update({
    data: {
      completed: true,
      isError: false,
    },
    where: { id: taskId },
  });
});

scannerQueue.on('task_failed', async (taskId: string, errorMessage: string) => {
  console.log('errorMessage', errorMessage);
  await prisma.task.update({
    data: {
      completed: true,
      isError: true,
      message: errorMessage,
    },
    where: { id: taskId },
  });
});

scannerQueue.on('drain', async () => {
  await prisma.task.updateMany({
    data: { completed: true },
    where: { completed: false },
  });
});
