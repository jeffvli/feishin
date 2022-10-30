import { z } from 'zod';
import { idValidation } from '@validations/shared.validation';

const list = {
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
};

const cancelAll = {
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
};

const cancel = {
  body: z.object({}),
  params: z.object({
    ...idValidation('taskId'),
  }),
  query: z.object({}),
};

export const tasksValidation = {
  cancel,
  cancelAll,
  list,
};
