import { z } from 'zod';
import { idValidation } from './shared.validation';

const noWhiteSpaces = /^\S*$/;

const list = {
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
};

const detail = {
  body: z.object({}),
  params: z.object({ ...idValidation('userId') }),
  query: z.object({}),
};

const createUser = {
  body: z.object({
    displayName: z.optional(z.string().min(0).max(100)),
    isAdmin: z.optional(z.boolean()),
    password: z.string().min(6).max(255),
    username: z
      .string()
      .min(2)
      .max(30)
      .refine((value) => noWhiteSpaces.test(value), {
        message: 'No white spaces allowed',
      }),
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
    displayName: z.optional(z.string().min(0).max(100)),
    isAdmin: z.optional(z.boolean()),
    password: z.optional(z.string().min(6).max(255)),
    username: z.optional(
      z
        .string()
        .min(2)
        .max(30)
        .refine((value) => noWhiteSpaces.test(value), {
          message: 'No white spaces allowed',
        })
    ),
  }),
  params: z.object({ ...idValidation('userId') }),
  query: z.object({}),
};

export const usersValidation = {
  createUser,
  deleteUser,
  detail,
  list,
  updateUser,
};
