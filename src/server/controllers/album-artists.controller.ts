import { Request, Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { service } from '@services/index';
import { validation, TypedRequest } from '@validations/index';

const getList = async (req: Request, res: Response) => {
  const { take, skip, serverFolderIds } = req.query;
  const albumArtists = await service.albumArtists.findMany(req, {
    serverFolderIds: String(serverFolderIds),
    skip: Number(skip),
    take: Number(take),
    user: req.authUser,
  });

  const success = ApiSuccess.ok({
    data: albumArtists.data,
    paginationItems: {
      skip: Number(skip),
      take: Number(take),
      totalEntries: albumArtists.totalEntries,
      url: req.originalUrl,
    },
  });

  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getDetail = async (
  req: TypedRequest<typeof validation.albumArtists.detail>,
  res: Response
) => {
  const { id } = req.params;
  const albumArtist = await service.albumArtists.findById({
    id,
    user: req.authUser,
  });

  const success = ApiSuccess.ok({ data: albumArtist });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const albumArtistsController = {
  getDetail,
  getList,
};
