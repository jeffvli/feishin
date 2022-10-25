import { z } from 'zod';

const login = {
  body: z.object({
    password: z.string(),
    username: z.string(),
  }),
  params: z.object({}),
  query: z.object({}),
};

const register = {
  body: z.object({
    password: z.string().min(6).max(255),
    username: z.string().min(4).max(26),
  }),
  params: z.object({}),
  query: z.object({}),
};

const refresh = {
  body: z.object({
    refreshToken: z.string(),
  }),
  params: z.object({}),
  query: z.object({}),
};

export const authValidation = {
  login,
  refresh,
  register,
};
