import express, { Router } from 'express';
import { songsController } from '../controllers/songs.controller';
import { authenticateLocal } from '../middleware';

export const songsRouter: Router = express.Router();

songsRouter.get('/', authenticateLocal, songsController.getSongs);
