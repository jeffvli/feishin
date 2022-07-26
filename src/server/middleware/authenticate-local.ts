import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

export const authenticateLocal = (
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

    req.auth = {
      createdAt: user?.createdAt,
      enabled: user?.enabled,
      id: user?.id,
      isAdmin: user?.isAdmin,
      updatedAt: user?.updatedAt,
      username: user?.username,
    };

    return next();
  })(req, res, next);
};
