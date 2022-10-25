import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { validateRequest, validation } from '@validations/index';

export const router: Router = express.Router({
  mergeParams: true,
  strict: true,
});

router.get('/', controller.albumArtists.getList);

router.get(
  ':serverId',
  validateRequest(validation.albumArtists.detail),
  controller.albumArtists.getDetail
);
