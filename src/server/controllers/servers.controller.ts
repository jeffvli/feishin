import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib';
import { serversService } from '../services';
import { getSuccessResponse, idValidation, validateRequest } from '../utils';

const getServerById = async (req: Request, res: Response) => {
  validateRequest(req, { params: z.object({ ...idValidation }) });

  const { id } = req.params;
  const data = await serversService.findById(req.auth, {
    id: Number(id),
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getServers = async (req: Request, res: Response) => {
  const data = await serversService.findMany(req.auth);

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const createServer = async (req: Request, res: Response) => {
  const data = await serversService.create(req.body);

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const refreshServer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await serversService.refresh({ id: Number(id) });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const scanServer = async (req: Request, res: Response) => {
  validateRequest(req, {
    query: z.object({ serverFolderIds: z.string().optional() }),
  });

  const { id } = req.params;
  const { serverFolderIds } = req.query;

  const data = await serversService.fullScan({
    id: Number(id),
    serverFolderIds: serverFolderIds && String(serverFolderIds),
    userId: Number(req.auth.id),
  });

  return res.status(data.statusCode).json(getSuccessResponse(data));
};

const getFolder = async (req: Request, res: Response) => {
  const data = await prisma.folder.findUnique({
    include: {
      children: true,
    },
    where: { id: Number(req.params.id) },
  });

  return res.status(200).json(getSuccessResponse({ data, statusCode: 200 }));
};

export const serversController = {
  createServer,
  getFolder,
  getServerById,
  getServers,
  refreshServer,
  scanServer,
};
