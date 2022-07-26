import { Request, Response } from 'express';
import { z } from 'zod';
import { usersService } from '../services';
import { getSuccessResponse, idValidation, validateRequest } from '../utils';

const getUser = async (req: Request, res: Response) => {
  validateRequest(req, { params: z.object({ ...idValidation }) });
  const { id } = req.params;
  const data = await usersService.getOne({ id: Number(id) });
  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getUsers = async (_req: Request, res: Response) => {
  const data = await usersService.getMany();
  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const usersController = {
  getUser,
  getUsers,
};
