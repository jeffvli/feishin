import express, { Router } from 'express';
import { controller } from '../controllers';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.albumArtists.getAlbumArtists);

router.get('/:id', controller.albumArtists.getAlbumArtistById);
