import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({ errorFormat: 'minimal' });
export const exclude = <T, Key extends keyof T>(
  resultSet: T,
  ...keys: Key[]
): Omit<T, Key> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of keys) {
    delete resultSet[key];
  }
  return resultSet;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

prisma.$use(async (params, next) => {
  const maxRetries = 5;
  let retries = 0;

  do {
    try {
      const result = await next(params);
      return result;
    } catch (err) {
      retries += 1;
      return sleep(500);
    }
  } while (retries < maxRetries);
});
