import { ServerPermissionType, ServerType, TaskType } from '@prisma/client';
import { SortOrder } from '@/types/types';
import { helpers } from '../helpers';
import { prisma } from '../lib';
import { AuthUser } from '../middleware';
import { subsonic } from '../queue';
import { jellyfin } from '../queue/jellyfin';
import { navidrome } from '../queue/navidrome';
import { ApiError } from '../utils';

const remoteServerLogin = async (options: {
  legacy?: boolean;
  password: string;
  type: ServerType;
  url: string;
  username: string;
}) => {
  if (options.type === ServerType.JELLYFIN) {
    const res = await jellyfin.api.authenticate({
      password: options.password,
      url: options.url,
      username: options.username,
    });

    if (!res) {
      throw ApiError.badRequest('Invalid credentials.');
    }

    return {
      remoteUserId: res.User.Id,
      token: res.AccessToken,
      type: ServerType.JELLYFIN,
      url: options.url,
      username: options.username,
    };
  }

  if (options.type === ServerType.SUBSONIC) {
    const res = await subsonic.api.authenticate({
      legacy: options.legacy,
      password: options.password,
      url: options.url,
      username: options.username,
    });

    if (res.status === 'failed') {
      throw ApiError.badRequest('Invalid credentials.');
    }

    return {
      remoteUserId: '',
      token: res.token,
      type: ServerType.SUBSONIC,
      url: options.url,
      username: options.username,
    };
  }

  if (options.type === ServerType.NAVIDROME) {
    const res = await navidrome.api.authenticate({
      password: options.password,
      url: options.url,
      username: options.username,
    });

    return {
      altToken: `u=${res.username}&s=${res.subsonicSalt}&t=${res.subsonicToken}`,
      remoteUserId: res.id,
      token: res.token,
      type: ServerType.NAVIDROME,
      url: options.url,
      username: options.username,
    };
  }

  throw ApiError.badRequest('Server type invalid.');
};

const getServerListMap = async () => {
  const servers = await prisma.server.findMany({});

  return servers.reduce((acc, server) => {
    acc[server.id] = {
      name: server.name,
      type: server.type,
    };
    return acc;
  }, {} as Record<string, { name: string; type: string }>);
};

const findById = async (user: AuthUser, options: { id: string }) => {
  const { id } = options;

  helpers.shared.checkServerPermissions(user, { serverId: id });

  const server = await prisma.server.findUnique({
    include: {
      serverFolders: user.isAdmin
        ? true
        : {
            where: {
              OR: [{ serverFolderPermissions: { some: { userId: user.id } } }],
            },
          },
      serverPermissions: {
        where: { userId: user.id },
      },
    },
    where: { id },
  });

  if (!server) {
    throw ApiError.notFound('');
  }

  return server;
};

const findMany = async (user: AuthUser, options?: { enabled?: boolean }) => {
  if (user.isAdmin) {
    return prisma.server.findMany({
      include: {
        serverFolders: {
          orderBy: { name: SortOrder.ASC },
          where: { enabled: options?.enabled ? true : undefined },
        },
        serverPermissions: {
          orderBy: { createdAt: SortOrder.ASC },
          where: { userId: user.id },
        },
        serverUrls: true,
      },
      orderBy: { createdAt: SortOrder.ASC },
    });
  }

  const servers = await prisma.server.findMany({
    include: {
      serverFolders: {
        orderBy: { name: SortOrder.ASC },
        where: {
          OR: [
            // Show all folders if user has server admin permissions
            {
              server: {
                serverPermissions: {
                  some: { type: ServerPermissionType.ADMIN, userId: user.id },
                },
              },
            },
            // If not admin, only show folders the user has permissions for
            { serverFolderPermissions: { some: { userId: user.id } } },
            {
              enabled: options?.enabled ? true : undefined,
              serverFolderPermissions: { some: { userId: user.id } },
            },
          ],
        },
      },
      serverPermissions: {
        orderBy: { createdAt: SortOrder.ASC },
        where: { userId: user.id },
      },
      serverUrls: true,
    },
    orderBy: { createdAt: SortOrder.ASC },
    where: { serverPermissions: { some: { userId: user.id } } },
  });

  return servers;
};

const create = async (options: {
  altToken?: string; // Used for Navidrome only
  name: string;
  remoteUserId: string;
  token: string;
  type: ServerType;
  url: string;
  username: string;
}) => {
  const isDuplicate = await prisma.server.findUnique({
    where: { url: options.url },
  });

  if (isDuplicate) {
    throw ApiError.conflict('Server already exists.');
  }

  const serverFolders: {
    name: string;
    remoteId: string;
    serverId: string;
  }[] = [];

  if (options.type === ServerType.SUBSONIC) {
    const serverFoldersRes = await subsonic.api.getMusicFolders({
      token: options.token,
      url: options.url,
    });

    if (!serverFoldersRes) {
      throw ApiError.badRequest('Server is inaccessible.');
    }

    const serverFoldersCreate = serverFoldersRes.map((folder) => {
      return {
        name: folder.name,
        remoteId: String(folder.id),
      };
    });

    const server = await prisma.server.create({
      data: {
        ...options,
        serverFolders: { create: serverFoldersCreate },
        serverUrls: { create: { url: options.url } },
      },
    });

    return server;
  }

  if (options.type === ServerType.NAVIDROME) {
    const serverFoldersRes = await subsonic.api.getMusicFolders({
      token: options.altToken,
      url: options.url,
    });

    if (!serverFoldersRes) {
      throw ApiError.badRequest('Server is inaccessible.');
    }

    const navidromeToken = options.token + '||' + options?.altToken;

    const serverFoldersCreate = serverFoldersRes.map((folder) => {
      return {
        name: folder.name,
        remoteId: String(folder.id),
      };
    });

    const server = await prisma.server.create({
      data: {
        name: options.name,
        remoteUserId: options.remoteUserId,
        serverFolders: { create: serverFoldersCreate },
        serverUrls: { create: { url: options.url } },
        token: navidromeToken,
        type: options.type,
        url: options.url,
        username: options.username,
      },
    });

    for (const serverFolder of serverFolders) {
      await prisma.serverFolder.upsert({
        create: serverFolder,
        update: { name: serverFolder.name },
        where: {
          uniqueServerFolderId: {
            remoteId: serverFolder.remoteId,
            serverId: serverFolder.serverId,
          },
        },
      });
    }

    return server;
  }

  if (options.type === ServerType.JELLYFIN) {
    const musicFoldersRes = await jellyfin.api.getMusicFolders({
      remoteUserId: options.remoteUserId,
      token: options.token,
      url: options.url,
    });

    if (!musicFoldersRes) {
      throw ApiError.badRequest('Server is inaccessible.');
    }

    const serverFoldersCreate = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.Name,
        remoteId: String(musicFolder.Id),
      };
    });

    const server = await prisma.server.create({
      data: {
        name: options.name,
        remoteUserId: options.remoteUserId,
        serverFolders: { create: serverFoldersCreate },
        serverUrls: { create: { url: options.url } },
        token: options.token,
        type: options.type,
        url: options.url,
        username: options.username,
      },
    });

    return server;
  }

  throw ApiError.badRequest('Server type invalid.');
};

const update = async (
  options: { id: string },
  data: {
    name?: string;
    noCredential?: boolean;
    remoteUserId?: string;
    token?: string;
    type?: ServerType;
    url?: string;
    username?: string;
  }
) => {
  return prisma.server.update({
    data,
    where: { id: options.id },
  });
};

const deleteById = async (options: { id: string }) => {
  return prisma.server.delete({
    where: { id: options.id },
  });
};

const refresh = async (options: { id: string }) => {
  const server = await prisma.server.findUnique({ where: { id: options.id } });

  if (!server) {
    throw ApiError.notFound('');
  }

  let serverFolders: {
    name: string;
    remoteId: string;
    serverId: string;
  }[] = [];

  if (server.type === ServerType.SUBSONIC) {
    const serverFoldersRes = await subsonic.api.getMusicFolders(server);
    serverFolders = serverFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.name,
        remoteId: String(musicFolder.id),
        serverId: server.id,
      };
    });
  }

  if (server.type === ServerType.JELLYFIN) {
    const musicFoldersRes = await jellyfin.api.getMusicFolders(server);
    serverFolders = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.Name,
        remoteId: String(musicFolder.Id),
        serverId: server.id,
      };
    });
  }

  // mark as deleted if not found
  for (const serverFolder of serverFolders) {
    await prisma.serverFolder.upsert({
      create: serverFolder,
      update: { name: serverFolder.name },
      where: {
        uniqueServerFolderId: {
          remoteId: serverFolder.remoteId,
          serverId: serverFolder.serverId,
        },
      },
    });
  }

  return server;
};

const findScanInProgress = async (options: { serverId: string }) => {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ type: TaskType.FULL_SCAN }, { type: TaskType.QUICK_SCAN }],
      completed: false,
      serverId: options.serverId,
    },
  });

  return tasks;
};

const fullScan = async (
  user: AuthUser,
  options: { id: string; serverFolderId?: string[] }
) => {
  const { id, serverFolderId } = options;

  // Only allow scan of enabled folders
  const server = await prisma.server.findUnique({
    include: { serverFolders: { where: { enabled: true } } },
    where: { id },
  });

  if (!server) {
    throw ApiError.notFound('Server does not exist.');
  }

  let serverFolders;
  if (serverFolderId) {
    serverFolders = server.serverFolders.filter((f) =>
      serverFolderId?.includes(f.id)
    );
  } else {
    serverFolders = server.serverFolders;
  }

  if (serverFolders.length === 0) {
    throw ApiError.notFound('No matching server folders found.');
  }

  const task = await prisma.task.create({
    data: {
      server: { connect: { id: server.id } },
      type: TaskType.FULL_SCAN,
      user: { connect: { id: user.id } },
    },
  });

  if (server.type === ServerType.JELLYFIN) {
    await jellyfin.scanner.scanAll(server, serverFolders, task);
  }

  if (server.type === ServerType.SUBSONIC) {
    await subsonic.scanner.scanAll(server, serverFolders, task);
  }

  if (server.type === ServerType.NAVIDROME) {
    await navidrome.scanner.scanAll(server, serverFolders, task);
  }

  return task;
};

const findServerUrlById = async (options: { id: string }) => {
  const serverUrl = await prisma.serverUrl.findUnique({
    where: { id: options.id },
  });

  return serverUrl;
};

const createUrl = async (options: { serverId: string; url: string }) => {
  const { serverId, url } = options;

  const serverUrl = await prisma.serverUrl.create({
    data: {
      serverId,
      url,
    },
  });

  return serverUrl;
};

const findUrlById = async (options: { id: string }) => {
  const url = await prisma.serverUrl.findUnique({
    where: { id: options.id },
  });

  if (!url) {
    throw ApiError.notFound('Url not found.');
  }

  return url;
};

const deleteUrlById = async (options: { id: string }) => {
  await prisma.serverUrl.delete({
    where: { id: options.id },
  });

  return null;
};

const enableUrlById = async (
  user: AuthUser,
  options: { id: string; serverId: string }
) => {
  await prisma.userServerUrl.deleteMany({ where: { userId: user.id } });
  await prisma.userServerUrl.create({
    data: {
      serverId: options.serverId,
      serverUrlId: options.id,
      userId: user.id,
    },
  });

  return null;
};

const disableUrlById = async (user: AuthUser) => {
  await prisma.userServerUrl.deleteMany({
    where: { userId: user.id },
  });

  return null;
};

const findFolderById = async (options: { id: string }) => {
  const url = await prisma.serverFolder.findUnique({
    where: { id: options.id },
  });

  if (!url) {
    throw ApiError.notFound('Folder not found.');
  }

  return url;
};

const deleteFolderById = async (options: { id: string }) => {
  return null;
};

const enableFolderById = async (options: { id: string }) => {
  await prisma.serverFolder.update({
    data: { enabled: true },
    where: { id: options.id },
  });

  return null;
};

const disableFolderById = async (options: { id: string }) => {
  await prisma.serverFolder.update({
    data: { enabled: false },
    where: { id: options.id },
  });

  return null;
};

const addPermission = async (options: {
  serverId: string;
  type: ServerPermissionType;
  userId: string;
}) => {
  const { serverId, userId, type } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const permission = await prisma.serverPermission.create({
    data: {
      serverId,
      type,
      userId,
    },
  });

  return permission;
};

const deletePermission = async (options: { id: string }) => {
  await prisma.serverPermission.delete({
    where: { id: options.id },
  });

  return null;
};

const updateServerPermission = async (options: {
  id: string;
  type: ServerPermissionType;
}) => {
  const { type, id } = options;

  const permission = await prisma.serverPermission.update({
    data: { type },
    where: { id },
  });

  return permission;
};

const addFolderPermission = async (options: {
  serverFolderId: string;
  userId: string;
}) => {
  const { serverFolderId, userId } = options;

  const permission = await prisma.serverFolderPermission.create({
    data: {
      serverFolderId,
      userId,
    },
  });

  return permission;
};

const deleteFolderPermission = async (options: { id: string }) => {
  await prisma.serverFolderPermission.delete({
    where: { id: options.id },
  });

  return null;
};

export const serversService = {
  addFolderPermission,
  addPermission,
  create,
  createUrl,
  deleteById,
  deleteFolderById,
  deleteFolderPermission,
  deletePermission,
  deleteUrlById,
  disableFolderById,
  disableUrlById,
  enableFolderById,
  enableUrlById,
  findById,
  findFolderById,
  findMany,
  findScanInProgress,
  findServerUrlById,
  findUrlById,
  fullScan,
  getServerListMap,
  refresh,
  remoteServerLogin,
  update,
  updateServerPermission,
};
