import { Request, Response } from 'express';
import { z } from 'zod';
import { AlbumSort } from '../helpers/albums.helpers';
import { albumsService } from '../services';
import { SortOrder } from '../types/types';
import {
  getSuccessResponse,
  idValidation,
  paginationValidation,
  validateRequest,
} from '../utils';

const getAlbumById = async (req: Request, res: Response) => {
  validateRequest(req, {
    params: z.object({ ...idValidation }),
    query: z.object({ serverUrls: z.optional(z.string().min(1)) }),
  });

  const { id } = req.params;
  const { serverUrls } = req.query;
  const data = await albumsService.findById({
    id: Number(id),
    serverUrls: serverUrls && String(serverUrls),
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getAlbums = async (req: Request, res: Response) => {
  validateRequest(req, {
    query: z.object({
      ...paginationValidation,
      orderBy: z.nativeEnum(SortOrder),
      serverFolderIds: z.optional(z.string().min(1)),
      serverUrls: z.optional(z.string().min(1)),
      sortBy: z.nativeEnum(AlbumSort),
    }),
  });

  const { limit, page, serverFolderIds, serverUrls, sortBy, orderBy } =
    req.query;
  const data = await albumsService.findMany(req, {
    limit: Number(limit),
    orderBy: orderBy as SortOrder,
    page: Number(page),
    serverFolderIds: serverFolderIds && String(serverFolderIds),
    serverUrls: serverUrls && String(serverUrls),
    sortBy: sortBy as AlbumSort,
    user: req.auth,
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

export const albumsController = {
  getAlbumById,
  getAlbums,
};
