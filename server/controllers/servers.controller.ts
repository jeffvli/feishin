import { ServerType } from '@prisma/client';
import { Response } from 'express';
import { ApiError, ApiSuccess, getSuccessResponse } from '@/utils';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';
import { TypedRequest, validation } from '@validations/index';

const getServerDetail = async (
  req: TypedRequest<typeof validation.servers.detail>,
  res: Response
) => {
  const { serverId } = req.params;
  const data = await service.servers.findById(req.authUser, { id: serverId });
  const success = ApiSuccess.ok({ data: toApiModel.servers([data]) });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getServerList = async (
  req: TypedRequest<typeof validation.servers.list>,
  res: Response
) => {
  const { enabled } = req.query;
  const data = await service.servers.findMany(req.authUser, {
    enabled: Boolean(enabled),
  });
  const success = ApiSuccess.ok({ data: toApiModel.servers(data) });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteServer = async (
  req: TypedRequest<typeof validation.servers.deleteServer>,
  res: Response
) => {
  const { serverId } = req.params;
  await service.servers.deleteById({ id: serverId });
  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const createServer = async (
  req: TypedRequest<typeof validation.servers.create>,
  res: Response
) => {
  const remoteServerLoginRes = await service.servers.remoteServerLogin(
    req.body
  );

  const data = await service.servers.create({
    name: req.body.name,
    ...remoteServerLoginRes,
  });

  const success = ApiSuccess.ok({ data: toApiModel.servers([data])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const updateServer = async (
  req: TypedRequest<typeof validation.servers.update>,
  res: Response
) => {
  const { serverId } = req.params;
  const { username, password, name, legacy, type, url, noCredential } =
    req.body;

  if (type && username && password && url) {
    const remoteServerLoginRes = await service.servers.remoteServerLogin({
      legacy,
      password,
      type,
      url,
      username,
    });

    const data = await service.servers.update(
      { id: serverId },
      {
        name,
        remoteUserId: remoteServerLoginRes.remoteUserId,
        token:
          type === ServerType.NAVIDROME
            ? `${remoteServerLoginRes.token}||${remoteServerLoginRes?.altToken}`
            : remoteServerLoginRes.token,
        type,
        url: remoteServerLoginRes.url,
        username: remoteServerLoginRes.username,
      }
    );

    const success = ApiSuccess.ok({ data: toApiModel.servers([data])[0] });
    return res.status(success.statusCode).json(getSuccessResponse(success));
  }

  const data = await service.servers.update(
    { id: serverId },
    { name, noCredential, url }
  );
  const success = ApiSuccess.ok({ data: toApiModel.servers([data])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const refreshServer = async (
  req: TypedRequest<typeof validation.servers.refresh>,
  res: Response
) => {
  const { serverId } = req.params;
  const data = await service.servers.refresh({ id: serverId });

  const success = ApiSuccess.ok({ data: toApiModel.servers([data])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const fullScanServer = async (
  req: TypedRequest<typeof validation.servers.scan>,
  res: Response
) => {
  const { serverId } = req.params;
  const { serverFolderId } = req.body;

  // TODO: Check that server is accessible first with the saved token, otherwise throw error

  const scansInProgress = await service.servers.findScanInProgress({
    serverId,
  });

  if (scansInProgress.length > 0) {
    throw ApiError.badRequest('Scan already in progress');
  }

  const io = req.app.get('socketio');
  await io.emit('task:started');

  const data = await service.servers.fullScan(req.authUser, {
    id: serverId,
    serverFolderId,
  });

  // return res.status(200).json({ data: null });
  const success = ApiSuccess.ok({ data });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const quickScanServer = async (
  req: TypedRequest<typeof validation.servers.scan>,
  res: Response
) => {
  const { serverId } = req.params;
  const { serverFolderId } = req.body;

  // TODO: Check that server is accessible first with the saved token, otherwise throw error

  const scansInProgress = await service.servers.findScanInProgress({
    serverId,
  });

  if (scansInProgress.length > 0) {
    throw ApiError.badRequest('Scan already in progress');
  }

  const io = req.app.get('socketio');
  await io.emit('task:started');

  // await service.servers.fullScan({
  //   id: serverId,
  //   serverFolderId,
  // });

  const success = ApiSuccess.ok({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const createServerUrl = async (
  req: TypedRequest<typeof validation.servers.createUrl>,
  res: Response
) => {
  const { serverId } = req.params;
  const { url } = req.body;

  const data = await service.servers.createUrl({
    serverId,
    url,
  });

  const success = ApiSuccess.ok({ data });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteServerUrl = async (
  req: TypedRequest<typeof validation.servers.deleteUrl>,
  res: Response
) => {
  const { urlId } = req.params;

  await service.servers.deleteUrlById({
    id: urlId,
  });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const enableServerUrl = async (
  req: TypedRequest<typeof validation.servers.enableUrl>,
  res: Response
) => {
  const { serverId, urlId } = req.params;

  await service.servers.enableUrlById(req.authUser, {
    id: urlId,
    serverId,
  });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const disableServerUrl = async (
  req: TypedRequest<typeof validation.servers.disableUrl>,
  res: Response
) => {
  await service.servers.disableUrlById(req.authUser);

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteServerFolder = async (
  req: TypedRequest<typeof validation.servers.deleteFolder>,
  res: Response
) => {
  const { folderId } = req.params;

  await service.servers.deleteFolderById({ id: folderId });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const enableServerFolder = async (
  req: TypedRequest<typeof validation.servers.enableFolder>,
  res: Response
) => {
  const { folderId } = req.params;

  await service.servers.enableFolderById({ id: folderId });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const disableServerFolder = async (
  req: TypedRequest<typeof validation.servers.disableFolder>,
  res: Response
) => {
  const { folderId } = req.params;

  await service.servers.disableFolderById({ id: folderId });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const addServerPermission = async (
  req: TypedRequest<typeof validation.servers.addServerPermission>,
  res: Response
) => {
  const { serverId } = req.params;
  const { userId, type } = req.body;

  const data = await service.servers.addPermission({
    serverId,
    type,
    userId,
  });

  const success = ApiSuccess.ok({ data });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteServerPermission = async (
  req: TypedRequest<typeof validation.servers.deleteServerPermission>,
  res: Response
) => {
  const { permissionId } = req.params;

  await service.servers.deletePermission({
    id: permissionId,
  });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const updateServerPermission = async (
  req: TypedRequest<typeof validation.servers.updateServerPermission>,
  res: Response
) => {
  const { permissionId } = req.params;
  const { type } = req.body;

  await service.servers.updateServerPermission({
    id: permissionId,
    type,
  });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const addServerFolderPermission = async (
  req: TypedRequest<typeof validation.servers.addServerFolderPermission>,
  res: Response
) => {
  const { folderId } = req.params;
  const { userId } = req.body;

  const data = await service.servers.addFolderPermission({
    serverFolderId: folderId,
    userId,
  });

  const success = ApiSuccess.ok({ data });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteServerFolderPermission = async (
  req: TypedRequest<typeof validation.servers.deleteServerFolderPermission>,
  res: Response
) => {
  const { permissionId } = req.params;

  await service.servers.deleteFolderPermission({ id: permissionId });

  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const serversController = {
  addServerFolderPermission,
  addServerPermission,
  createServer,
  createServerUrl,
  deleteServer,
  deleteServerFolder,
  deleteServerFolderPermission,
  deleteServerPermission,
  deleteServerUrl,
  disableServerFolder,
  disableServerUrl,
  enableServerFolder,
  enableServerUrl,
  fullScanServer,
  getServerDetail,
  getServerList,
  quickScanServer,
  refreshServer,
  updateServer,
  updateServerPermission,
};
