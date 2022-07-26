import express, { Router } from 'express';
import { albumsController } from '../controllers';
import { authenticateLocal } from '../middleware';

export const albumsRouter: Router = express.Router();

albumsRouter.get('/', authenticateLocal, albumsController.getAlbums);

albumsRouter.get('/:id', authenticateLocal, albumsController.getAlbumById);
