import md5 from 'md5';
import { useQuery } from 'react-query';
import { queryKeys } from 'renderer/api/queryKeys';
import { serversApi } from 'renderer/api/serversApi';
import { ServerFolderResponse } from 'renderer/api/types';
import { ServerFolderAuth } from 'types';

export const useServers = () => {
  return useQuery({
    onSuccess: (servers) => {
      const { serverUrl } = JSON.parse(
        localStorage.getItem('authentication') || '{}'
      );
      const storedServersKey = `servers_${md5(serverUrl)}`;
      const serversFromLocalStorage = localStorage.getItem(storedServersKey);

      // If a custom account/token is set for a server, use that instead of the default one
      if (serversFromLocalStorage) {
        const existingServers = JSON.parse(serversFromLocalStorage);

        // The 'locked' property determines whether or not to skip updating the server auth
        const skipped = existingServers.filter(
          (server: ServerFolderAuth) => server.locked
        );

        const store = servers?.data?.flatMap((server) =>
          server.serverFolder?.map((serverFolder: ServerFolderResponse) => {
            if (skipped.includes(serverFolder.id)) {
              return existingServers.find(
                (s: ServerFolderAuth) => s.id === serverFolder.id
              );
            }

            return {
              id: serverFolder.id,
              locked: false,
              serverId: server.id,
              token: server.token,
              type: server.serverType,
              url: server.url,
              userId: server.remoteUserId,
              username: server.username,
            };
          })
        );

        return localStorage.setItem(storedServersKey, JSON.stringify(store));
      }

      const store = servers?.data?.flatMap((server) =>
        server.serverFolder?.map((serverFolder: ServerFolderResponse) => ({
          id: serverFolder.id,
          locked: false,
          serverId: server.id,
          token: server.token,
          type: server.serverType,
          url: server.url,
          userId: server.remoteUserId,
          username: server.username,
        }))
      );

      return localStorage.setItem(storedServersKey, JSON.stringify(store));
    },
    queryFn: () => serversApi.getServers(),
    queryKey: queryKeys.servers,
  });
};
