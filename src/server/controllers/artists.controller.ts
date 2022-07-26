import { Request, Response } from 'express';
import { z } from 'zod';
import { artistsService } from '../services';
import {
  getSuccessResponse,
  idValidation,
  paginationValidation,
  validateRequest,
} from '../utils';

const getArtistById = async (req: Request, res: Response) => {
  validateRequest(req, { params: z.object({ ...idValidation }) });

  const { id } = req.params;
  const data = await artistsService.findById({
    id: Number(id),
    user: req.auth,
  });
  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getArtists = async (req: Request, res: Response) => {
  validateRequest(req, {
    query: z.object({
      ...paginationValidation,
      serverFolderIds: z.string().min(1),
    }),
  });

  const { limit, page, serverFolderIds } = req.query;
  const data = await artistsService.findMany(req, {
    limit: Number(limit),
    page: Number(page),
    serverFolderIds: String(serverFolderIds),
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const artistsController = { getArtistById, getArtists };
