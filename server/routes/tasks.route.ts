import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { prisma } from '@lib/prisma';
import { authenticateAdmin } from '@middleware/authenticate-admin';
import { ApiError } from '@utils/api-error';
import { validation } from '@validations/index';
import { validateRequest } from '@validations/shared.validation';

export const router: Router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(validateRequest(validation.tasks.list), controller.tasks.getActiveTasks);

router
  .route('/cancel')
  .post(
    authenticateAdmin,
    validateRequest(validation.tasks.cancelAll),
    controller.tasks.cancelAllTasks
  );

router.param('taskId', async (_req, _res, next, taskId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  next();
});

router
  .route('/:taskId/cancel')
  .post(
    authenticateAdmin,
    validateRequest(validation.tasks.cancel),
    controller.tasks.cancelTaskById
  );
