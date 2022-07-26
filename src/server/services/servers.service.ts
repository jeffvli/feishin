import { prisma } from '../lib';
import {
  jellyfinApi,
  jellyfinTasks,
  subsonicApi,
  subsonicTasks,
} from '../queue';
import { User } from '../types/types';
import { ApiError, ApiSuccess, splitNumberString } from '../utils';

const findById = async (user: User, options: { id: number }) => {
  const { id } = options;
  const server = await prisma.server.findUnique({
    include: {
      serverFolders: user.isAdmin
        ? true
        : {
            where: {
              OR: [
                { isPublic: true },
                { serverFolderPermissions: { some: { userId: user.id } } },
              ],
            },
          },
    },
    where: { id },
  });

  if (!server) {
    throw ApiError.notFound('');
  }

  if (!user.isAdmin && server.serverFolders.length === 0) {
    throw ApiError.forbidden('');
  }

  return ApiSuccess.ok({ data: server });
};

const findMany = async (user: User) => {
  let servers;

  if (user.isAdmin) {
    servers = await prisma.server.findMany({
      include: { serverFolders: true },
    });
  } else {
    servers = await prisma.server.findMany({
      include: {
        serverFolders: {
          where: {
            OR: [
              { isPublic: true },
              { serverFolderPermissions: { some: { userId: user.id } } },
            ],
          },
        },
      },
      where: { serverFolders: { some: { isPublic: true } } },
    });
  }

  return ApiSuccess.ok({ data: servers });
};

const create = async (options: {
  name: string;
  remoteUserId: string;
  serverType: string;
  token: string;
  url: string;
  username: string;
}) => {
  const checkDuplicate = await prisma.server.findUnique({
    where: { url: options.url },
  });

  if (checkDuplicate) {
    throw ApiError.conflict('Server already exists.');
  }

  let musicFoldersData: {
    name: string;
    remoteId: string;
    serverId: number;
  }[] = [];

  if (options.serverType === 'subsonic') {
    const musicFoldersRes = await subsonicApi.getMusicFolders({
      token: options.token,
      url: options.url,
    });

    if (!musicFoldersRes) {
      throw ApiError.badRequest('Server is inaccessible.');
    }

    const server = await prisma.server.create({
      data: {
        name: options.name,
        remoteUserId: options.remoteUserId,
        serverType: options.serverType,
        token: options.token,
        url: options.url,
        username: options.username,
      },
    });

    musicFoldersData = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.name,
        remoteId: String(musicFolder.id),
        serverId: server.id,
      };
    });

    musicFoldersData.forEach(async (musicFolder) => {
      await prisma.serverFolder.upsert({
        create: musicFolder,
        update: { name: musicFolder.name },
        where: {
          uniqueServerFolderId: {
            remoteId: musicFolder.remoteId,
            serverId: musicFolder.serverId,
          },
        },
      });
    });

    return ApiSuccess.ok({ data: { ...server } });
  }

  if (options.serverType === 'jellyfin') {
    const musicFoldersRes = await jellyfinApi.getMusicFolders({
      remoteUserId: options.remoteUserId,
      token: options.token,
      url: options.url,
    });

    if (!musicFoldersRes) {
      throw ApiError.badRequest('Server is inaccessible.');
    }

    const server = await prisma.server.create({
      data: {
        name: options.name,
        remoteUserId: options.remoteUserId,
        serverType: options.serverType,
        serverUrls: { create: { url: options.url } },
        token: options.token,
        url: options.url,
        username: options.username,
      },
    });

    musicFoldersData = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.Name,
        remoteId: String(musicFolder.Id),
        serverId: server.id,
      };
    });

    musicFoldersData.forEach(async (musicFolder) => {
      await prisma.serverFolder.upsert({
        create: musicFolder,
        update: { name: musicFolder.name },
        where: {
          uniqueServerFolderId: {
            remoteId: musicFolder.remoteId,
            serverId: musicFolder.serverId,
          },
        },
      });
    });

    return ApiSuccess.ok({ data: { ...server } });
  }

  return ApiSuccess.ok({ data: {} });
};

const refresh = async (options: { id: number }) => {
  const { id } = options;
  const server = await prisma.server.findUnique({ where: { id } });

  if (!server) {
    throw ApiError.notFound('');
  }

  let musicFoldersData: {
    name: string;
    remoteId: string;
    serverId: number;
  }[] = [];

  if (server.serverType === 'subsonic') {
    const musicFoldersRes = await subsonicApi.getMusicFolders(server);
    musicFoldersData = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.name,
        remoteId: String(musicFolder.id),
        serverId: server.id,
      };
    });
  }

  if (server.serverType === 'jellyfin') {
    const musicFoldersRes = await jellyfinApi.getMusicFolders(server);
    musicFoldersData = musicFoldersRes.map((musicFolder) => {
      return {
        name: musicFolder.Name,
        remoteId: String(musicFolder.Id),
        serverId: server.id,
      };
    });
  }

  // mark as deleted if not found

  musicFoldersData.forEach(async (musicFolder) => {
    await prisma.serverFolder.upsert({
      create: musicFolder,
      update: { name: musicFolder.name },
      where: {
        uniqueServerFolderId: {
          remoteId: musicFolder.remoteId,
          serverId: musicFolder.serverId,
        },
      },
    });
  });

  return ApiSuccess.ok({ data: { ...server } });
};

const fullScan = async (options: {
  id: number;
  serverFolderIds?: string;
  userId: number;
}) => {
  const { id, serverFolderIds } = options;
  const server = await prisma.server.findUnique({
    include: { serverFolders: true },
    where: { id },
  });

  if (!server) {
    throw ApiError.notFound('Server does not exist.');
  }

  let serverFolders;
  if (serverFolderIds) {
    const selectedServerFolderIds = splitNumberString(serverFolderIds);
    serverFolders = server.serverFolders.filter((folder) =>
      selectedServerFolderIds?.includes(folder.id)
    );
  } else {
    serverFolders = server.serverFolders;
  }

  if (server.serverType === 'jellyfin') {
    for (const serverFolder of serverFolders) {
      const task = await prisma.task.create({
        data: {
          completed: false,
          inProgress: true,
          name: 'Full scan',
          serverFolderId: serverFolder.id,
        },
      });

      await jellyfinTasks.scanAll(server, serverFolder, task);
    }
  }

  if (server.serverType === 'subsonic') {
    for (const serverFolder of serverFolders) {
      const task = await prisma.task.create({
        data: {
          completed: false,
          inProgress: true,
          name: 'Full scan',
          serverFolderId: serverFolder.id,
        },
      });

      await subsonicTasks.scanAll(server, serverFolder, task);
    }
  }

  return ApiSuccess.ok({ data: {} });
};

export const serversService = {
  create,
  findById,
  findMany,
  fullScan,
  refresh,
};
