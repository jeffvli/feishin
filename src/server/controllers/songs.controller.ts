import { Request, Response } from 'express';
import { z } from 'zod';
import { songsService } from '../services/songs.service';
import {
  getSuccessResponse,
  paginationValidation,
  validateRequest,
} from '../utils';

const getSongs = async (req: Request, res: Response) => {
  validateRequest(req, {
    query: z.object({
      ...paginationValidation,
      albumIds: z.optional(z.string()),
      artistIds: z.optional(z.string()),
      serverFolderIds: z.optional(z.string().min(1)),
      songIds: z.optional(z.string()),
    }),
  });

  const { limit, page, serverFolderIds } = req.query;

  const data = await songsService.findMany(req, {
    limit: Number(limit),
    page: Number(page),
    serverFolderIds: String(serverFolderIds),
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const songsController = {
  getSongs,
};
