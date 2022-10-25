import { Request, Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';

const getUserDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await service.users.findById(req.authUser, { id });
  const success = ApiSuccess.ok({ data: toApiModel.users([user])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const getUserList = async (_req: Request, res: Response) => {
  const users = await service.users.findMany();
  const success = ApiSuccess.ok({ data: toApiModel.users(users) });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const usersController = {
  getUserDetail,
  getUserList,
};
