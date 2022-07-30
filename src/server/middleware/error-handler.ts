import { NextFunction, Request, Response } from 'express';
import { isJsonString } from '../utils';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message = '';

  const trace = err.stack.match(/at .* \(.*\)/g).map((e: string) => {
    return e.replace(/\(|\)/g, '');
  });

  if (err.message) {
    message = isJsonString(err.message)
      ? Array.isArray(JSON.parse(err.message))
        ? JSON.parse(err.message)[0].message // Handles errors sent from zod preprocess
        : JSON.parse(err.message)
      : err.message;
  }

  res.status(err.statusCode || 500).json({
    error: {
      message,
      path: req.path,
      trace,
    },
    response: 'Error',
    statusCode: err.statusCode || 500,
  });

  next();
};
