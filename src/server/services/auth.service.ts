import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib';
import { generateRefreshToken, generateToken } from '../lib/passport';
import { ApiSuccess, randomString } from '../utils';
import { ApiError } from '../utils/api-error';

const login = async (options: { username: string }) => {
  const { username } = options;
  const user = await prisma.user.findUnique({ where: { username } });

  if (user) {
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    const res = { ...user, accessToken, refreshToken };

    return ApiSuccess.ok({ data: res });
  }

  throw ApiError.notFound('The user does not exist.');
};

const register = async (options: { password: string; username: string }) => {
  const { username, password } = options;
  const userExists = await prisma.user.findUnique({ where: { username } });

  if (userExists) {
    throw ApiError.conflict('The user already exists.');
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

  return ApiSuccess.ok({ data: user });
};

const logout = async (options: { user: User }) => {
  const { user } = options;
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  return ApiSuccess.noContent({ data: {} });
};

const refresh = async (options: { refreshToken: string }) => {
  const { refreshToken } = options;
  const user = jwt.verify(refreshToken, String(process.env.TOKEN_SECRET));
  const { id } = user as { exp: number; iat: number; id: number };

  const token = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!token) {
    throw ApiError.unauthorized('Invalid refresh token.');
  }

  const newToken = generateToken(id);

  return ApiSuccess.ok({ data: { accessToken: newToken } });
};

export const authService = {
  login,
  logout,
  refresh,
  register,
};
