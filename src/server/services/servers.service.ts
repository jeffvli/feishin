import { ServerType, TaskType } from '@prisma/client';
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
      altToken: `u=${res.name}&s=${res.subsonicSalt}&t=${res.subsonicToken}`,
      remoteUserId: res.id,
      token: res.token,
      type: ServerType.NAVIDROME,
      url: options.url,
      username: options.username,
    };
  }

  throw ApiError.badRequest('Server type invalid.');
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

const findMany = async (user: AuthUser) => {
  if (user.isAdmin) {
    return prisma.server.findMany({
      include: {
        serverFolders: {
          orderBy: { name: SortOrder.ASC },
        },
        serverPermissions: {
          orderBy: { createdAt: SortOrder.ASC },
          where: { userId: user.id },
        },
        serverUrls: {
          include: {
            userServerUrls: {
              where: { userId: user.id },
            },
          },
        },
      },
      orderBy: { createdAt: SortOrder.ASC },
    });
  }

  const servers = await prisma.server.findMany({
    include: {
      serverFolders: {
        orderBy: { name: SortOrder.ASC },
        where: { id: { in: user.flatServerFolderPermissions } },
      },
      serverPermissions: {
        orderBy: { createdAt: SortOrder.ASC },
        where: { userId: user.id },
      },
      serverUrls: true,
    },
    orderBy: { createdAt: SortOrder.ASC },
    where: { id: { in: user.flatServerPermissions } },
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

    // for (const serverFolder of serverFolders) {
    //   await prisma.serverFolder.upsert({
    //     create: serverFolder,
    //     update: { name: serverFolder.name },
    //     where: {
    //       uniqueServerFolderId: {
    //         remoteId: serverFolder.remoteId,
    //         serverId: serverFolder.serverId,
    //       },
    //     },
    //   });
    // }

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
        token: options.token,
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
    altToken?: string; // Used for Navidrome only
    name?: string;
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

const fullScan = async (options: { id: string; serverFolderId?: string[] }) => {
  const { id, serverFolderId } = options;
  const server = await prisma.server.findUnique({
    include: { serverFolders: true },
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
      completed: false,
      name: 'Full scan',
      server: { connect: { id: server.id } },
      type: TaskType.FULL_SCAN,
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

  return {};
};

const findServerUrlById = async (options: { id: string }) => {
  const serverUrl = await prisma.serverUrl.findUnique({
    where: { id: options.id },
  });

  return serverUrl;
};

// const findCredentialById = async (options: { id: string }) => {
//   const credential = await prisma.serverCredential.findUnique({
//     where: { id: options.id },
//   });

//   if (!credential) {
//     throw ApiError.notFound('Credential not found.');
//   }

//   return credential;
// };

// const createCredential = async (options: {
//   credential: string;
//   serverId: string;
//   userId: string;
//   username: string;
// }) => {
//   const { credential, serverId, userId, username } = options;

//   const serverCredential = await prisma.serverCredential.create({
//     data: {
//       credential,
//       serverId,
//       userId,
//       username,
//     },
//   });

//   return serverCredential;
// };

// const deleteCredentialById = async (options: { id: string }) => {
//   await prisma.serverCredential.delete({
//     where: { id: options.id },
//   });
// };

// const enableCredentialById = async (options: { id: string }) => {
//   const serverCredential = await prisma.serverCredential.update({
//     data: { enabled: true },
//     where: { id: options.id },
//   });

//   const { id, userId, serverId } = serverCredential;

//   await prisma.serverCredential.updateMany({
//     data: { enabled: false },
//     where: { AND: [{ serverId, userId }, { NOT: { id } }] },
//   });

//   return serverCredential;
// };

// const disableCredentialById = async (options: { id: string }) => {
//   const serverCredential = await prisma.serverCredential.update({
//     data: { enabled: false },
//     where: { id: options.id },
//   });

//   return serverCredential;
// };

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

export const serversService = {
  create,
  createUrl,
  deleteById,
  deleteUrlById,
  disableUrlById,
  enableUrlById,
  findById,
  findMany,
  findServerUrlById,
  findUrlById,
  fullScan,
  refresh,
  remoteServerLogin,
  update,
};
