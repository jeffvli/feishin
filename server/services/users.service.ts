import fs from 'fs';
import { FileType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import md5 from 'md5';
import sharp from 'sharp';
import { prisma } from '@lib/prisma';
import { AuthUser } from '@middleware/authenticate';
import { randomString, ApiError } from '@utils/index';
import { SortOrder } from '../types/types';

const findById = async (user: AuthUser, options: { id: string }) => {
  const { id } = options;

  // Possibly restrict detail later if additional sensitive user data is added
  // if (!user.isAdmin && user.id !== id) {
  //   throw ApiError.forbidden();
  // }

  const uniqueUser = await prisma.user.findUnique({
    include: {
      files: true,
      serverFolderPermissions: true,
      serverPermissions: true,
    },
    where: { id },
  });

  if (!uniqueUser) {
    throw ApiError.notFound('');
  }

  return uniqueUser;
};

const findMany = async () => {
  const users = await prisma.user.findMany({
    include: {
      files: true,
      serverFolderPermissions: true,
      serverPermissions: true,
    },
    orderBy: [{ isAdmin: SortOrder.DESC }, { username: SortOrder.ASC }],
  });

  return users;
};

const createUser = async (
  user: AuthUser,
  data: {
    displayName?: string;
    isAdmin?: boolean;
    password: string;
    username: string;
  }
) => {
  const { password, username, displayName, isAdmin } = data;

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
      enabled: true,
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
    image?: Express.Multer.File | null;
    isAdmin?: boolean;
    password?: string;
    username?: string;
  }
) => {
  const { userId } = options;
  const { username, password, isAdmin, displayName, image } = data;

  const hashedPassword = password && (await bcrypt.hash(password, 12));

  let avatar: {
    fileName: string;
    path: string;
    size: number;
    type: FileType;
  } | null = null;

  if (image) {
    const existingUser = await prisma.user.findUnique({
      include: { files: true },
      where: { id: userId },
    });

    const existingFile = existingUser?.files.find(
      (file) => file.type === FileType.USER
    );

    // Delete the existing file
    if (existingFile) {
      await prisma.file.delete({ where: { id: existingFile.id } });
      const filePath = `../files/${existingFile.fileName}`;
      fs.unlink(filePath, (err) => {
        if (err) console.log(err);
      });
    }

    // Create optimized webp image and delete the original
    const avatarFilename = `${md5(randomString(12))}.webp`;
    const avatarPath = `files/${avatarFilename}`;
    const newImage = await sharp(image.buffer)
      .webp({ quality: 20 })
      .toFile(avatarPath);
    avatar = {
      fileName: avatarFilename,
      path: avatarPath,
      size: newImage.size,
      type: FileType.USER,
    };
  }

  const user = await prisma.user.update({
    data: {
      displayName,
      files:
        image && avatar
          ? {
              create: {
                fileName: avatar.fileName,
                originalName: image?.originalname!,
                path: avatar.path,
                size: avatar.size,
                type: avatar.type,
              },
            }
          : undefined,
      isAdmin,
      password: hashedPassword,
      username,
    },
    include: {
      files: true,
      serverFolderPermissions: true,
      serverPermissions: true,
    },
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
