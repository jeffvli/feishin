import { ServerPermissionType } from '@prisma/client';
import { AuthUser } from '@/middleware';
import { ApiError } from '@/utils';
import { prisma } from '@lib/prisma';

const checkServerPermissions = (
  user: AuthUser,
  options: { serverId?: string }
) => {
  const { serverId } = options;

  if (user.isAdmin || !serverId) {
    return;
  }

  if (serverId && !user.flatServerPermissions.includes(serverId)) {
    throw ApiError.forbidden();
  }
};

const checkServerFolderPermissions = (
  user: AuthUser,
  options: { serverFolderId?: string[] | string; serverId: string }
) => {
  const { serverFolderId, serverId } = options;

  if (user.isAdmin || !serverFolderId) {
    return;
  }

  const isServerAdmin =
    user.serverPermissions.find((s) => s.serverId === serverId)?.type ===
    ServerPermissionType.ADMIN;

  if (isServerAdmin) {
    return;
  }

  let ids: string[] = [];
  if (typeof serverFolderId === 'string') {
    ids = [serverFolderId];
  } else if (typeof serverFolderId === 'object') {
    ids = serverFolderId;
  }

  for (const id of ids) {
    if (!user.flatServerFolderPermissions.includes(id)) {
      throw ApiError.forbidden('');
    }
  }
};

const getAvailableServerFolderIds = async (
  user: AuthUser,
  options: { serverId: string }
) => {
  const { serverId } = options;

  if (user.isAdmin) {
    const serverFoldersWithAccess = await prisma.serverFolder.findMany({
      where: { enabled: true, serverId },
    });

    const serverFoldersWithAccessIds = serverFoldersWithAccess.map(
      (serverFolder) => serverFolder.id
    );

    return serverFoldersWithAccessIds;
  }

  const serverFoldersWithAccess = await prisma.serverFolder.findMany({
    where: {
      OR: [
        {
          server: {
            serverPermissions: {
              some: { type: ServerPermissionType.ADMIN, userId: user.id },
            },
          },
        },
        {
          AND: [
            {
              enabled: true,
              serverFolderPermissions: {
                some: { userId: { equals: user.id } },
              },
            },
          ],
        },
      ],
    },
  });

  const serverFoldersWithAccessIds = serverFoldersWithAccess.map(
    (serverFolder) => serverFolder.id
  );

  return serverFoldersWithAccessIds;
};

const serverFolderFilter = (serverFolderIds: string[]) => {
  return {
    serverFolders: { every: { id: { in: serverFolderIds } } },
  };
};

const paginationParams = (options: { skip: any; take: any }) => {
  const { skip, take } = options;

  return {
    skip: Number(skip),
    take: Number(take),
  };
};

export const sharedHelpers = {
  checkServerFolderPermissions,
  checkServerPermissions,
  getAvailableServerFolderIds,
  params: {
    pagination: paginationParams,
  },
  serverFolderFilter,
};
