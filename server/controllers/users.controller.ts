import { Request, Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';
import { validation } from '@validations/index';
import { TypedRequest } from '@validations/shared.validation';

const getUserDetail = async (
  req: TypedRequest<typeof validation.users.detail>,
  res: Response
) => {
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

const createUser = async (
  req: TypedRequest<typeof validation.users.createUser>,
  res: Response
) => {
  const user = await service.users.createUser(req.body);
  const success = ApiSuccess.ok({ data: toApiModel.users([user])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const updateUser = async (
  req: TypedRequest<typeof validation.users.updateUser>,
  res: Response
) => {
  const { userId } = req.params;
  const user = await service.users.updateUser({ userId }, req.body);
  const success = ApiSuccess.ok({ data: toApiModel.users([user])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const deleteUser = async (
  req: TypedRequest<typeof validation.users.deleteUser>,
  res: Response
) => {
  const { userId } = req.params;
  await service.users.deleteUser({ userId });
  const success = ApiSuccess.noContent({ data: null });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const usersController = {
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  updateUser,
};
