import { Prisma, PrismaClient } from '@prisma/client';

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
  const maxRetries = 3;
  let retries = 0;

  do {
    try {
      const result = await next(params);
      return result;
    } catch (err) {
      console.log('err', err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          retries = 3; // Don't retry on unique constraint violation
          return null;
        }
      }
      retries += 1;
      return sleep(100);
    }
  } while (retries < maxRetries);
});

// prisma.$use(async (params, next) => {
//   const before = Date.now();

//   const result = await next(params);

//   const after = Date.now();

//   console.log(
//     `Query ${params.model}.${params.action} took ${after - before}ms`
//   );

//   return result;
// });
