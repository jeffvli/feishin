import { z } from 'zod';
import { idValidation } from './shared.validation';

const detail = {
  body: z.object({}),
  params: z.object(idValidation),
  query: z.object({}),
};

export const usersValidation = {
  detail,
};
