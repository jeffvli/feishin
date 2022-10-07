import { ipcMain } from 'electron';
import { prisma } from '..';

export enum ServerApi {
  GET_SERVER = 'api:server:get-server',
  GET_SERVERS = 'api:server:get-servers',
}

ipcMain.handle(ServerApi.GET_SERVERS, async () => {
  const result = await prisma.server.findMany();
  return result;
});
