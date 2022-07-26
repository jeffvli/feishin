import express, { Router } from 'express';
import { artistsController } from '../controllers';
import { authenticateLocal } from '../middleware';

export const artistsRouter: Router = express.Router();

artistsRouter.get('/', authenticateLocal, artistsController.getArtists);

artistsRouter.get('/:id', authenticateLocal, artistsController.getArtistById);
