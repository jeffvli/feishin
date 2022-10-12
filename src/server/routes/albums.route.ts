import express, { Router } from 'express';
import { controller } from '../controllers';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.albums.getAlbumList);

router.get('/:id', controller.albums.getAlbumDetail);
