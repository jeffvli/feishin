import express, { Router } from 'express';
import passport from 'passport';
import { controller } from '@controllers/index';
import { authenticate } from '@middleware/authenticate';
import { validation, validateRequest } from '@validations/index';

export const router: Router = express.Router({ mergeParams: true });

router.post(
  '/login',
  validateRequest(validation.auth.login),
  passport.authenticate('local'),
  controller.auth.login
);

router.post(
  '/register',
  validateRequest(validation.auth.register),
  controller.auth.register
);

router.post('/logout', authenticate, controller.auth.logout);

router.post(
  '/refresh',
  validateRequest(validation.auth.refresh),
  controller.auth.refresh
);

router.get('/ping', controller.auth.ping);
