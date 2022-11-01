import { z } from 'zod';
import { idValidation } from '@validations/shared.validation';

const list = {
  body: z.object({}),
  params: z.object({ ...idValidation('serverId') }),
  query: z.object({}),
};

export const genresValidation = {
  list,
};
