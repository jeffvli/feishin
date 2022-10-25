import { Request, Response } from 'express';
import { ApiSuccess, getSuccessResponse } from '@/utils';
import { toApiModel } from '@helpers/api-model';
import { service } from '@services/index';
import { validation, TypedRequest } from '@validations/index';
import packageJson from '../package.json';

const login = async (
  req: TypedRequest<typeof validation.auth.login>,
  res: Response
) => {
  const { username } = req.body;
  const user = await service.auth.login({ username });

  const success = ApiSuccess.ok({ data: toApiModel.users([user])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const register = async (
  req: TypedRequest<typeof validation.auth.register>,
  res: Response
) => {
  const { username, password } = req.body;
  const user = await service.auth.register({
    password,
    username,
  });

  const success = ApiSuccess.ok({ data: toApiModel.users([user])[0] });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const logout = async (req: Request, res: Response) => {
  await service.auth.logout({
    user: req.authUser,
  });

  const success = ApiSuccess.noContent({ data: {} });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

const ping = async (_req: Request, res: Response) => {
  return res.status(200).json(
    getSuccessResponse({
      data: {
        description: packageJson.description,
        name: packageJson.name,
        version: packageJson.version,
      },
      statusCode: 200,
    })
  );
};

const refresh = async (
  req: TypedRequest<typeof validation.auth.refresh>,
  res: Response
) => {
  const refresh = await service.auth.refresh({
    refreshToken: req.body.refreshToken,
  });

  const success = ApiSuccess.ok({ data: refresh });
  return res.status(success.statusCode).json(getSuccessResponse(success));
};

export const authController = { login, logout, ping, refresh, register };
