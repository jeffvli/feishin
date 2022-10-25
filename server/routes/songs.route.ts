import express, { Router } from 'express';
import { validation, validateRequest } from '@validations/index';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', validateRequest(validation.songs.list), async (req, res) => {
  // const data = await controller.songs.getSongList(req.authUser, req.query);

  return res.status(200).json({});
  // return res.status(success.statusCode).json(getSuccessResponse(success));
});
