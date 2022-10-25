import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { validateRequest, validation } from '@validations/index';

export const router: Router = express.Router({ mergeParams: true });

router.get(
  '/',
  validateRequest(validation.albums.list),
  controller.albums.getList
);

router.get(
  '/:albumId',
  validateRequest(validation.albums.detail),
  controller.albums.getDetail
);

router.get(
  '/:albumId/songs',
  validateRequest(validation.albums.detail),
  controller.albums.getDetailSongList
);
