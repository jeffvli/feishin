import { prisma, exclude } from '../lib';
import { ApiError, ApiSuccess } from '../utils';

const getOne = async (options: { id: number }) => {
  const { id } = options;
  const user = await prisma.user.findUnique({
    include: {
      serverFolderPermissions: true,
    },
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound('');
  }

  return ApiSuccess.ok({ data: exclude(user, 'password') });
};

const getMany = async () => {
  const users = await prisma.user.findMany({
    select: {
      createdAt: true,
      enabled: true,
      id: true,
      isAdmin: true,
      serverFolderPermissions: true,
      updatedAt: true,
      username: true,
    },
  });

  return ApiSuccess.ok({ data: users });
};

export const usersService = {
  getMany,
  getOne,
};
