import { Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';
import { TypedRequest, validation } from '@validations/index';

const getDetail = async (
  req: TypedRequest<typeof validation.albums.detail>,
  res: Response
) => {
  const { albumId } = req.params;

  const album = await service.albums.findById(req.authUser, { id: albumId });

  const success = ApiSuccess.ok({
    data: toApiModel.albums({ items: [album], user: req.authUser })[0],
  });

  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getList = async (
  req: TypedRequest<typeof validation.albums.list>,
  res: Response
) => {
  const { serverId } = req.params;
  const { take, skip, serverUrlId } = req.query;

  const albums = await service.albums.findMany({
    ...req.query,
    serverId,
    skip: Number(skip),
    take: Number(take),
    user: req.authUser,
  });

  const serverUrl = serverUrlId
    ? await service.servers.findServerUrlById({
        id: serverUrlId,
      })
    : undefined;

  const success = ApiSuccess.ok({
    data: toApiModel.albums({
      items: albums.data,
      serverUrl: serverUrl?.url,
      user: req.authUser,
    }),
    paginationItems: {
      skip: Number(skip),
      take: Number(take),
      totalEntries: albums.totalEntries,
      url: req.originalUrl,
    },
  });

  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getDetailSongList = async (
  req: TypedRequest<typeof validation.albums.list>,
  res: Response
) => {
  const { serverId } = req.params;
  const { take, skip, serverUrlId } = req.query;

  const albums = await service.albums.findMany({
    ...req.query,
    serverId,
    skip: Number(skip),
    take: Number(take),
    user: req.authUser,
  });

  const serverUrl = serverUrlId
    ? await service.servers.findServerUrlById({
        id: serverUrlId,
      })
    : undefined;

  const success = ApiSuccess.ok({
    data: toApiModel.albums({
      items: albums.data,
      serverUrl: serverUrl?.url,
      user: req.authUser,
    }),
    paginationItems: {
      skip: Number(skip),
      take: Number(take),
      totalEntries: albums.totalEntries,
      url: req.originalUrl,
    },
  });

  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const albumsController = {
  getDetail,
  getDetailSongList,
  getList,
};
