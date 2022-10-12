import express, { Router } from 'express';
import { controller } from '../controllers';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.artists.getArtists);

router.get('/:id', controller.artists.getArtistById);
