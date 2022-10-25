import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { authenticateAdmin } from '@middleware/authenticate-admin';
import { service } from '@services/index';
import { validateRequest, validation } from '@validations/index';

export const router: Router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    validateRequest(validation.servers.list),
    controller.servers.getServerList
  )
  .post(
    authenticateAdmin,
    validateRequest(validation.servers.create),
    controller.servers.createServer
  );

router
  .route('/:serverId')
  .get(
    validateRequest(validation.servers.detail),
    controller.servers.getServerDetail
  )
  .patch(
    authenticateAdmin,
    validateRequest(validation.servers.update),
    controller.servers.updateServer
  )
  .delete(
    authenticateAdmin,
    validateRequest(validation.servers.deleteServer),
    controller.servers.deleteServer
  );

router
  .route('/:serverId/refresh')
  .get(
    authenticateAdmin,
    validateRequest(validation.servers.refresh),
    controller.servers.refreshServer
  );

router
  .route('/:serverId/scan')
  .post(
    validateRequest(validation.servers.scan),
    authenticateAdmin,
    controller.servers.scanServer
  );

router
  .route('/:serverId/url')
  .post(
    authenticateAdmin,
    validateRequest(validation.servers.createUrl),
    controller.servers.createServerUrl
  );

router.param('urlId', async (_req, _res, next, urlId) => {
  await service.servers.findUrlById({ id: urlId });
  next();
});

router
  .route('/:serverId/url/:urlId')
  .delete(
    authenticateAdmin,
    validateRequest(validation.servers.deleteUrl),
    controller.servers.deleteServerUrl
  );

router
  .route('/:serverId/url/:urlId/enable')
  .post(
    validateRequest(validation.servers.enableUrl),
    controller.servers.enableServerUrl
  );

router
  .route('/:serverId/url/:urlId/disable')
  .post(
    validateRequest(validation.servers.disableUrl),
    controller.servers.disableServerUrl
  );
