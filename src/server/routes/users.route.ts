import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { validateRequest, validation } from '@validations/index';
import { authenticateAdmin } from '../middleware/authenticate-admin';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', authenticateAdmin, controller.users.getUserList);

router.get(
  ':serverId',
  validateRequest(validation.users.detail),
  controller.users.getUserDetail
);
