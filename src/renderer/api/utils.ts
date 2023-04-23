import { AxiosHeaders } from 'axios';
import { z } from 'zod';

// Since ts-rest client returns a strict response type, we need to add the headers to the body object
export const resultWithHeaders = <ItemType extends z.ZodTypeAny>(itemSchema: ItemType) => {
  return z.object({
    data: itemSchema,
    headers: z.instanceof(AxiosHeaders),
  });
};
