import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { service } from '@services/index';
import { ApiError } from '@utils/index';
import { authenticateAdmin } from '../middleware/authenticate-admin';

export const router: Router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authenticateAdmin, controller.users.getUserList)
  .post(authenticateAdmin, controller.users.createUser);

router.param('userId', async (req, _res, next, userId) => {
  await service.users.findById(req.authUser, { id: userId });

  if (req.authUser.isAdmin || req.authUser.id === userId) {
    return next();
  }

  throw ApiError.forbidden('You are not allowed to access this resource');
});

router.route('/:userId/update').post(controller.users.updateUser);

router.route('/:userId/delete').post(controller.users.deleteUser);
