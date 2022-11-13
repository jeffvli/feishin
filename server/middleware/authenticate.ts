import { ServerFolderPermission, ServerPermission, User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

export type AuthUser = Request['authUser'];

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
      (permission: ServerFolderPermission) => permission.serverFolderId
    );

    const flatServerPermissions = user.serverPermissions.map(
      (permission: ServerPermission) => permission.serverId
    );

    const props = {
      createdAt: user?.createdAt,
      deviceId: user?.deviceId,
      enabled: user?.enabled,
      flatServerFolderPermissions,
      flatServerPermissions,
      id: user?.id,
      isAdmin: user?.isAdmin,
      isSuperAdmin: user?.isSuperAdmin,
      serverFolderPermissions: user?.serverFolderPermissions,
      serverId: req.params.serverId,
      serverPermissions: user?.serverPermissions,
      updatedAt: user?.updatedAt,
      username: user?.username,
    };

    req.authUser = props;

    return next();
  })(req, res, next);
};
