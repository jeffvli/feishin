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

  const { take, skip, serverFolderIds } = req.query;

  const data = await songsService.findMany(req, {
    serverFolderIds: String(serverFolderIds),
    skip: Number(skip),
    take: Number(take),
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const songsController = {
  getSongs,
};
