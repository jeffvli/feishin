import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { service } from '@services/index';
import { ApiError } from '@utils/index';
import { validation } from '@validations/index';
import { validateRequest } from '@validations/shared.validation';
import { authenticateAdmin } from '../middleware/authenticate-admin';

export const router: Router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    authenticateAdmin,
    validateRequest(validation.users.list),
    controller.users.getUserList
  )
  .post(
    authenticateAdmin,
    validateRequest(validation.users.createUser),
    controller.users.createUser
  );

router.param('userId', async (req, _res, next, userId) => {
  const user = await service.users.findById(req.authUser, { id: userId });

  if (req.authUser.id === userId) {
    return next();
  }

  // Only superadmins can modify other admins
  if (user.isAdmin && !req.authUser.isSuperAdmin) {
    throw ApiError.forbidden('You are not authorized to access this resource');
  }

  return next();
});

router
  .route('/:userId')
  .get(validateRequest(validation.users.detail), controller.users.getUserDetail)
  .patch(
    validateRequest(validation.users.updateUser),
    controller.users.updateUser
  )
  .delete(
    validateRequest(validation.users.deleteUser),
    controller.users.deleteUser
  );
