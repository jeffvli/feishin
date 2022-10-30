import { Request, Response } from 'express';
import { queue } from '@/queue/queues';
import { toApiModel } from '@helpers/api-model';
import { prisma } from '@lib/prisma';
import { ApiSuccess } from '@utils/api-success';
import { getSuccessResponse } from '@utils/get-success-response';
import { validation } from '@validations/index';
import { TypedRequest } from '@validations/shared.validation';
import { SortOrder } from '../types/types';

const getActiveTasks = async (_req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    include: {
      server: true,
      user: true,
    },
    orderBy: {
      createdAt: SortOrder.ASC,
    },
    where: {
      completed: false,
      isError: false,
    },
  });

  if (queue.scanner.length === 0) {
    await prisma.task.updateMany({
      data: { completed: true, isError: true, message: 'Task not found' },
      where: { completed: false },
    });
  }

  const success = ApiSuccess.ok({ data: toApiModel.tasks({ items: tasks }) });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const cancelAllTasks = async (
  _req: TypedRequest<typeof validation.tasks.cancelAll>,
  res: Response
) => {
  const runningTasks = await prisma.task.findMany({
    include: {
      server: true,
      user: true,
    },
    where: {
      completed: false,
      isError: false,
    },
  });

  for (const task of runningTasks) {
    queue.scanner.push({
      fn: async () => {
        return {};
      },
      id: task.id,
    });
  }

  await prisma.task.updateMany({
    data: {
      completed: true,
      message: 'Task was cancelled by user',
    },
    where: { completed: false },
  });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const cancelTaskById = async (
  req: TypedRequest<typeof validation.tasks.cancel>,
  res: Response
) => {
  const { taskId } = req.params;

  const task = await prisma.task.update({
    data: {
      completed: true,
      message: 'Task was cancelled by user',
    },
    include: {
      server: true,
      user: true,
    },
    where: { id: taskId },
  });

  queue.scanner.push({
    fn: async () => {
      return {};
    },
    id: taskId,
  });

  const success = ApiSuccess.ok({
    data: toApiModel.tasks({ items: [task] })[0],
  });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const tasksController = {
  cancelAllTasks,
  cancelTaskById,
  getActiveTasks,
};
