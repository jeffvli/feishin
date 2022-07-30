// Taken from zod-express-middleware: https://github.com/Aquila169/zod-express-middleware
import { z, ZodError, ZodSchema } from 'zod';
import { ApiError } from './api-error';

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

export const validateRequest = (
  req: any,
  schemas: RequestValidation<any, any, any>
) => {
  const { params, query, body } = schemas;
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
};

const requiredErrorMessage = (
  type: 'Query' | 'Body' | 'Params',
  key: string
) => {
  return `(${type}) [${key}] Required`;
};

export const paginationValidation = {
  skip: z.preprocess(
    (a) =>
      parseInt(
        z
          .string({
            required_error: requiredErrorMessage(ValidationType.QUERY, 'skip'),
          })
          .parse(a),
        10
      ),
    z.number().min(0, { message: 'Must have skip' })
  ),
  take: z.preprocess(
    (a) =>
      parseInt(
        z
          .string({
            required_error: requiredErrorMessage(ValidationType.QUERY, 'take'),
          })
          .parse(a),
        10
      ),
    z.number().min(0)
  ),
};

export const idValidation = {
  id: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number()),
};
