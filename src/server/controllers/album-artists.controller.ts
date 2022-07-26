import { Request, Response } from 'express';
import { z } from 'zod';
import { albumArtistsService } from '../services';
import {
  getSuccessResponse,
  idValidation,
  paginationValidation,
  validateRequest,
} from '../utils';

const getAlbumArtists = async (req: Request, res: Response) => {
  validateRequest(req, {
    query: z.object({
      ...paginationValidation,
      serverFolderIds: z.string().min(1),
    }),
  });

  const { limit, page, serverFolderIds } = req.query;
  const data = await albumArtistsService.findMany(req, {
    limit: Number(limit),
    page: Number(page),
    serverFolderIds: String(serverFolderIds),
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getAlbumArtistById = async (req: Request, res: Response) => {
  validateRequest(req, { params: z.object({ ...idValidation }) });

  const { id } = req.params;
  const data = await albumArtistsService.findById({
    id: Number(id),
    user: req.auth,
  });
  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const albumArtistsController = { getAlbumArtistById, getAlbumArtists };
