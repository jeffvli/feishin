import { Response } from 'express';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';
import { ApiSuccess } from '@utils/api-success';
import { getSuccessResponse } from '@utils/get-success-response';
import { validation } from '@validations/index';
import { TypedRequest } from '@validations/shared.validation';

const getList = async (
  req: TypedRequest<typeof validation.genres.list>,
  res: Response
) => {
  const { serverId } = req.params;

  const data = await service.genres.findManyByServer({ serverId });

  const success = ApiSuccess.ok({ data: toApiModel.genres(data) });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const genresController = {
  getList,
};
