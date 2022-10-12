import express, { Router } from 'express';
import passport from 'passport';
import { controller } from '../controllers';
import { authenticate } from '../middleware';

export const router: Router = express.Router({ mergeParams: true });

router.post('/login', passport.authenticate('local'), controller.auth.login);

router.post('/register', controller.auth.register);

router.post('/logout', authenticate, controller.auth.logout);

router.post('/refresh', controller.auth.refresh);

router.get('/ping', controller.auth.ping);
