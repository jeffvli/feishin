import {
  ServerFolderPermissions,
  ServerPermissions,
  User,
} from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

export type AuthUser = User & {
  flatServerFolderPermissions: string[];
  flatServerPermissions: string[];
  serverFolderPermissions: ServerFolderPermissions[];
  serverPermissions: ServerPermissions[];
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        error: {
          message: info?.message || 'Invalid authorization.',
          path: req.path,
        },
        response: 'Error',
        statusCode: 401,
      });
    }

    if (!user.enabled) {
      return res.status(401).json({
        error: {
          message: 'Your account is not enabled.',
          path: req.path,
        },
        response: 'Error',
        statusCode: 401,
      });
    }

    const flatServerFolderPermissions = user.serverFolderPermissions.map(
      (permission: ServerFolderPermissions) => permission.serverFolderId
    );

    const flatServerPermissions = user.serverPermissions.map(
      (permission: ServerPermissions) => permission.serverId
    );

    const auth = {
      createdAt: user?.createdAt,
      enabled: user?.enabled,
      flatServerFolderPermissions,
      flatServerPermissions,
      id: user?.id,
      isAdmin: user?.isAdmin,
      serverFolderPermissions: user?.serverFolderPermissions,
      serverPermissions: user?.serverPermissions,
      updatedAt: user?.updatedAt,
      username: user?.username,
    };

    req.auth = auth;

    return next();
  })(req, res, next);
};
