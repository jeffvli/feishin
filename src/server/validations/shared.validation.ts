// Modified from zod-express-middleware: https://github.com/Aquila169/zod-express-middleware
import { Request, RequestHandler } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { SortOrder } from '../types/types';
import { ApiError } from '../utils';

export type TypedRequest<
  S extends {
    body: z.AnyZodObject;
    params: z.AnyZodObject;
    query: z.AnyZodObject;
  }
> = Request<z.infer<S['params']>, any, z.infer<S['body']>, z.infer<S['query']>>;

export enum ValidationType {
  BODY = 'Body',
  PARAMS = 'Params',
  QUERY = 'Query',
}

type RequestValidation<TParams, TQuery, TBody> = {
  body?: ZodSchema<TBody>;
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
};

type ErrorListItem = {
  errors: ZodError<any>;
  type: ValidationType;
};

export const validateRequest: <TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody>
) => RequestHandler<TParams, any, TBody, TQuery> =
  ({ params, query, body }) =>
  (req, _res, next) => {
    const errors: Array<ErrorListItem> = [];
    if (params) {
      const parsed = params.safeParse(req.params);
      if (!parsed.success) {
        errors.push({ errors: parsed.error, type: ValidationType.PARAMS });
      }
    }
    if (query) {
      const parsed = query.safeParse(req.query);
      if (!parsed.success) {
        errors.push({ errors: parsed.error, type: ValidationType.QUERY });
      }
    }
    if (body) {
      const parsed = body.safeParse(req.body);
      if (!parsed.success) {
        errors.push({ errors: parsed.error, type: ValidationType.BODY });
      }
    }

    if (errors.length > 0) {
      const message = JSON.stringify(
        [
          `(${errors[0].type})`,
          `[${errors[0].errors.issues[0].path[0]}]`,
          errors[0].errors.issues[0].message,
        ].join(' ')
      );

      throw ApiError.badRequest(message);
    }

    return next();
  };

// const requiredErrorMessage = (
//   type: 'Query' | 'Body' | 'Params',
//   key: string
// ) => {
//   return `(${type}) [${key}] Required`;
// };

export const paginationValidation = {
  skip: z.string().refine((value) => {
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed >= 0;
  }),
  take: z.string().refine((value) => {
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed >= 0;
  }),
};

export const idValidation = {
  id: z.string().uuid(),
};

export const serverFolderIdValidation = {
  serverFolderId: z.optional(z.string().uuid().array()),
};

export const orderByValidation = {
  orderBy: z.nativeEnum(SortOrder),
};
