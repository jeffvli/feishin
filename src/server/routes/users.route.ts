import express, { Router } from 'express';
import { usersController } from '../controllers';
import { authenticateLocal } from '../middleware';

export const usersRouter: Router = express.Router();

usersRouter.get('/', authenticateLocal, usersController.getUsers);

usersRouter.get('/:id', authenticateLocal, usersController.getUser);
