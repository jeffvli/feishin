import { Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { service } from '@services/index';
import { validation, TypedRequest } from '@validations/index';

const getDetail = async (
  req: TypedRequest<typeof validation.artists.detail>,
  res: Response
) => {
  const { id } = req.params;

  const artist = await service.artists.findById({
    id,
    user: req.authUser,
  });

  const success = ApiSuccess.ok({ data: artist });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getList = async (
  req: TypedRequest<typeof validation.artists.list>,
  res: Response
) => {
  const { take, skip, serverFolderId } = req.query;

  // const artists = await service.artists.findMany(req, {
  //   serverFolderIds: String(serverFolderIds),
  //   skip: Number(skip),
  //   take: Number(take),
  //   user: req.authUser,
  // });

  // const success = ApiSuccess.ok({
  //   data: artists,
  //   paginationItems: {
  //     skip: Number(skip),
  //     take: Number(take),
  //     totalEntries,
  //     url: req.originalUrl,
  //   },
  // });

  // return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const artistsController = {
  getDetail,
  getList,
};
