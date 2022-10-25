import express, { Router } from 'express';
import { controller } from '@controllers/index';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.artists.getList);

router.get(':serverId', controller.artists.getDetail);
