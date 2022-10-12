import express, { Router } from 'express';
import { controller } from '../controllers';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.users.getUsers);

router.get('/:id', controller.users.getUser);
