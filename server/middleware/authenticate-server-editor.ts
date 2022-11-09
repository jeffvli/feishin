import { ServerPermission, ServerPermissionType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

export const authenticateServerEditor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.serverId) {
    return res.status(403).json({
      error: {
        message: 'Server id is required.',
        path: req.path,
      },
      response: 'Error',
      statusCode: 403,
    });
  }

  if (req.authUser.isAdmin || req.authUser.isSuperAdmin) {
    return next();
  }

  const permission = req.authUser.serverPermissions.find(
    (p: ServerPermission) => p.serverId === req.params.serverId
  )?.type;

  if (
    permission !== ServerPermissionType.EDITOR &&
    permission !== ServerPermissionType.ADMIN
  ) {
    return res.status(403).json({
      error: {
        message: 'This action requires "Editor" server permissions.',
        path: req.path,
      },
      response: 'Error',
      statusCode: 403,
    });
  }

  return next();
};
