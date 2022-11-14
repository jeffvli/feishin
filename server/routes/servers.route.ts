import express, { Router } from 'express';
import { controller } from '@controllers/index';
import { authenticateAdmin } from '@middleware/authenticate-admin';
import { authenticateServerAdmin } from '@middleware/authenticate-server-admin';
import { authenticateServerEditor } from '@middleware/authenticate-server-editor';
import { authenticateServerViewer } from '@middleware/authenticate-server-viewer';
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
    authenticateServerAdmin,
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
    authenticateServerEditor,
    validateRequest(validation.servers.refresh),
    controller.servers.refreshServer
  );

router
  .route('/:serverId/scan')
  .post(
    authenticateServerAdmin,
    validateRequest(validation.servers.scan),
    controller.servers.quickScanServer
  );

router
  .route('/:serverId/full-scan')
  .post(
    authenticateServerAdmin,
    validateRequest(validation.servers.scan),
    controller.servers.fullScanServer
  );

router
  .route('/:serverId/url')
  .post(
    authenticateServerEditor,
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
    authenticateServerEditor,
    validateRequest(validation.servers.deleteUrl),
    controller.servers.deleteServerUrl
  );

router
  .route('/:serverId/url/:urlId/enable')
  .post(
    authenticateServerViewer,
    validateRequest(validation.servers.enableUrl),
    controller.servers.enableServerUrl
  );

router
  .route('/:serverId/url/:urlId/disable')
  .post(
    authenticateServerViewer,
    validateRequest(validation.servers.disableUrl),
    controller.servers.disableServerUrl
  );

router
  .route('/:serverId/permissions')
  .post(
    authenticateServerAdmin,
    validateRequest(validation.servers.addServerPermission),
    controller.servers.addServerPermission
  );

router
  .route('/:serverId/permissions/:permissionId')
  .patch(
    authenticateServerAdmin,
    validateRequest(validation.servers.updateServerPermission),
    controller.servers.updateServerPermission
  )
  .delete(
    authenticateServerAdmin,
    validateRequest(validation.servers.deleteServerPermission),
    controller.servers.deleteServerPermission
  );

router.param('folderId', async (_req, _res, next, folderId) => {
  await service.servers.findFolderById({ id: folderId });
  next();
});

router
  .route('/:serverId/folder/:folderId')
  .delete(
    authenticateServerAdmin,
    validateRequest(validation.servers.deleteFolder),
    controller.servers.deleteServerFolder
  );

router
  .route('/:serverId/folder/:folderId/enable')
  .post(
    authenticateServerAdmin,
    validateRequest(validation.servers.enableFolder),
    controller.servers.enableServerFolder
  );

router
  .route('/:serverId/folder/:folderId/disable')
  .post(
    authenticateServerAdmin,
    validateRequest(validation.servers.disableFolder),
    controller.servers.disableServerFolder
  );

router
  .route('/:serverId/folder/:folderId/permissions')
  .post(authenticateServerAdmin, controller.servers.addServerFolderPermission);

router
  .route('/:serverId/folder/:folderId/permissions/:folderPermissionId')
  .delete(
    authenticateServerAdmin,
    controller.servers.deleteServerFolderPermission
  );
