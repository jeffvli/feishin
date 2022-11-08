import { z } from 'zod';
import { idValidation } from './shared.validation';

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('userId') }),
  query: z.object({}),
};

const createUser = {
  body: z.object({
    displayName: z.optional(z.string()),
    password: z.string().min(6).max(255),
    username: z.string().min(2).max(255),
  }),
  params: z.object({}),
  query: z.object({}),
};

const deleteUser = {
  body: z.object({}),
  params: z.object({ ...idValidation('userId') }),
  query: z.object({}),
};

const updateUser = {
  body: z.object({
    displayName: z.optional(z.string().min(2).max(255)),
    password: z.optional(z.string().min(6).max(255)),
    username: z.optional(z.string().min(2).max(255)),
  }),
  params: z.object({ ...idValidation('userId') }),
  query: z.object({}),
};

export const usersValidation = {
  createUser,
  deleteUser,
  detail,
  updateUser,
};
