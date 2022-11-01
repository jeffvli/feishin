import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { validation } from '@validations/index';
import { validateRequest } from '@validations/shared.validation';

export const router: Router = express.Router({ mergeParams: true });

router.get(
  '/',
  validateRequest(validation.genres.list),
  controller.genres.getList
);
