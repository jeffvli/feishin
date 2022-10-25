import { prisma } from '../lib';
import { AuthUser } from '../middleware';
import { ApiError } from '../utils';

const findById = async (user: AuthUser, options: { id: string }) => {
  const { id } = options;

  if (!user.isAdmin && user.id !== id) {
    throw ApiError.forbidden();
  }

  const uniqueUser = await prisma.user.findUnique({
    include: { serverFolderPermissions: true },
    where: { id },
  });

  if (!uniqueUser) {
    throw ApiError.notFound('');
  }

  return uniqueUser;
};

const findMany = async () => {
  const users = await prisma.user.findMany({});
  return users;
};

export const usersService = {
  findById,
  findMany,
};
