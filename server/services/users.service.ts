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

const createUser = async (options: {
  displayName?: string;
  password: string;
  username: string;
}) => {
  const { password, username, displayName } = options;

  const [userExists, displayNameExists] = await prisma.$transaction([
    prisma.user.findUnique({ where: { username } }),
    prisma.user.findUnique({ where: { displayName } }),
  ]);

  if (userExists) {
    throw ApiError.conflict('The user already exists.');
  }

  if (displayNameExists) {
    throw ApiError.conflict('The display name already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      deviceId: `${username}_${randomString(10)}`,
      enabled: false,
      password: hashedPassword,
      username,
    },
  });

  return user;
};

const deleteUser = async (options: { userId: string }) => {
  const { userId } = options;

  const user = await prisma.user.delete({ where: { id: userId } });
  return user;
};

const updateUser = async (
  options: { userId: string },
  data: {
    password?: string;
    username?: string;
  }
) => {
  const { userId } = options;
  const { username, password } = data;

  const hashedPassword = password && (await bcrypt.hash(password, 12));

  const user = await prisma.user.update({
    data: { password: hashedPassword, username },
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
