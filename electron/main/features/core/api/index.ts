import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { app, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import './server';

const dbPath = isDev
  ? path.join(__dirname, '../../../../prisma/dev.db')
  : path.join(app.getPath('userData'), 'database.db');

if (!isDev) {
  try {
    // database file does not exist, need to create
    fs.copyFileSync(path.join(process.resourcesPath, 'prisma/dev.db'), dbPath, fs.constants.COPYFILE_EXCL);
    console.log(`DB does not exist. Create new DB from ${path.join(process.resourcesPath, 'prisma/dev.db')}`);
  } catch (err) {
    if (err && 'code' in (err as { code: string }) && (err as { code: string }).code !== 'EEXIST') {
      console.error(`DB creation faild. Reason:`, err);
    } else {
      throw err;
    }
  }
}

function getPlatformName(): string {
  const isDarwin = process.platform === 'darwin';
  if (isDarwin && process.arch === 'arm64') {
    return `${process.platform}Arm64`;
  }

  return process.platform;
}

const platformToExecutables: Record<string, any> = {
  darwin: {
    migrationEngine: 'node_modules/@prisma/engines/migration-engine-darwin',
    queryEngine: 'node_modules/@prisma/engines/libquery_engine-darwin.dylib.node',
  },
  darwinArm64: {
    migrationEngine: 'node_modules/@prisma/engines/migration-engine-darwin-arm64',
    queryEngine: 'node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node',
  },
  linux: {
    migrationEngine: 'node_modules/@prisma/engines/migration-engine-debian-openssl-1.1.x',
    queryEngine: 'node_modules/@prisma/engines/libquery_engine-debian-openssl-1.1.x.so.node',
  },
  win32: {
    migrationEngine: 'node_modules/@prisma/engines/migration-engine-windows.exe',
    queryEngine: 'node_modules/@prisma/engines/query_engine-windows.dll.node',
  },
};

const extraResourcesPath = app.getAppPath().replace('app.asar', ''); // impacted by extraResources setting in electron-builder.yml
const platformName = getPlatformName();

const mePath = path.join(extraResourcesPath, platformToExecutables[platformName].migrationEngine);
const qePath = path.join(extraResourcesPath, platformToExecutables[platformName].queryEngine);

ipcMain.on('config:get-app-path', (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on('config:get-platform-name', (event) => {
  const isDarwin = process.platform === 'darwin';
  event.returnValue =
    isDarwin && process.arch === 'arm64' ? `${process.platform}Arm64` : (event.returnValue = process.platform);
});

ipcMain.on('config:get-prisma-db-path', (event) => {
  event.returnValue = dbPath;
});

ipcMain.on('config:get-prisma-me-path', (event) => {
  event.returnValue = mePath;
});

ipcMain.on('config:get-prisma-qe-path', (event) => {
  event.returnValue = qePath;
});

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
  errorFormat: 'minimal',
  // see https://github.com/prisma/prisma/discussions/5200
  // __internal: {
  //   engine: {
  //     binaryPath: qePath,
  //   },
  // },
});

prisma.server.findMany({
  where: {},
});

export const exclude = <T, Key extends keyof T>(resultSet: T, ...keys: Key[]): Omit<T, Key> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key of keys) {
    delete resultSet[key];
  }
  return resultSet;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

prisma.$use(async (params, next) => {
  const maxRetries = 5;
  let retries = 0;

  do {
    try {
      const result = await next(params);
      return result;
    } catch (err) {
      retries += 1;
      return sleep(500);
    }
  } while (retries < maxRetries);
});
