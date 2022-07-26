import { z } from 'zod';

export const paginationValidation = {
  limit: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0).max(1000)
  ),
  page: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number()),
};

export const idValidation = {
  id: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number()),
};
