import { NextFunction, Request, Response } from 'express';

export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth.isAdmin) {
    return res.status(403).json({
      error: {
        message: 'This action requires an administrator account.',
        path: req.path,
      },
      response: 'Error',
      statusCode: 403,
    });
  }

  return next();
};
