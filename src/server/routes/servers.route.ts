import express, { Router } from 'express';
import { controller } from '../controllers';
import { authenticateAdmin } from '../middleware';

export const router: Router = express.Router({ mergeParams: true });

router.get('/', controller.servers.getServerList);

router.post('/', authenticateAdmin, controller.servers.createServer);

router.get('/:id', controller.servers.getServerDetail);

router.get('/:id/refresh', authenticateAdmin, controller.servers.refreshServer);

router.get('/:id/folder', authenticateAdmin, controller.servers.getFolder);

router.post('/:id/scan', authenticateAdmin, controller.servers.scanServer);
