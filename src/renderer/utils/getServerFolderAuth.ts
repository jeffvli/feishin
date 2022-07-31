import md5 from 'md5';
import { ServerFolderAuth } from '../../types';

export const getServerFolderAuth = (
  serverUrl: string,
  serverFolderId: number
) => {
  const storedServersKey = `servers_${md5(serverUrl)}`;
  const serversFromLocalStorage = localStorage.getItem(storedServersKey);

  if (serversFromLocalStorage) {
    const existingServers: ServerFolderAuth[] = JSON.parse(
      serversFromLocalStorage
    );

    const server = existingServers.find((s) => s.id === serverFolderId);
    return server;
  }

  return undefined;
};
