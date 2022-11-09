import bcrypt from 'bcryptjs';
import { prisma } from '@lib/prisma';
import { AuthUser } from '@middleware/authenticate';
import { randomString, ApiError } from '@utils/index';

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

const createUser = async (
  user: AuthUser,
  options: {
    displayName?: string;
    isAdmin?: boolean;
    password: string;
    username: string;
  }
) => {
  const { password, username, displayName, isAdmin } = options;

  if (isAdmin && !user.isSuperAdmin) {
    throw ApiError.badRequest('You are not authorized to create an admin.');
  }

  const userExists = await prisma.user.findUnique({ where: { username } });

  if (userExists) {
    throw ApiError.conflict('The user already exists.');
  }

  const displayNameExists = await prisma.user.findUnique({
    where: { displayName },
  });

  if (displayNameExists) {
    throw ApiError.conflict('The display name already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const createdUser = await prisma.user.create({
    data: {
      deviceId: `${username}_${randomString(10)}`,
      enabled: false,
      isAdmin,
      password: hashedPassword,
      username,
    },
  });

  return createdUser;
};

const deleteUser = async (options: { userId: string }) => {
  const { userId } = options;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound('The user does not exist.');
  }

  if (user?.isSuperAdmin) {
    throw ApiError.badRequest('You cannot delete a superadmin.');
  }

  await prisma.user.delete({ where: { id: userId } });
};

const updateUser = async (
  options: { userId: string },
  data: {
    displayName?: string;
    isAdmin?: boolean;
    password?: string;
    username?: string;
  }
) => {
  const { userId } = options;
  const { username, password, isAdmin, displayName } = data;

  const hashedPassword = password && (await bcrypt.hash(password, 12));

  const user = await prisma.user.update({
    data: { displayName, isAdmin, password: hashedPassword, username },
    where: { id: userId },
  });

  return user;
};

export const usersService = {
  createUser,
  deleteUser,
  findById,
  findMany,
  updateUser,
};
