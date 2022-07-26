import express, { Router } from 'express';
import { serversController } from '../controllers';
import { authenticateAdmin, authenticateLocal } from '../middleware';

export const serversRouter: Router = express.Router();

serversRouter.get('/', authenticateLocal, serversController.getServers);

serversRouter.get('/:id', authenticateLocal, serversController.getServerById);

serversRouter.get(
  '/:id/refresh',
  authenticateAdmin,
  serversController.refreshServer
);

serversRouter.get(
  '/:id/folder',
  authenticateAdmin,
  serversController.getFolder
);

serversRouter.post('/', authenticateAdmin, serversController.createServer);

serversRouter.post(
  '/:id/scan',
  authenticateAdmin,
  serversController.scanServer
);
