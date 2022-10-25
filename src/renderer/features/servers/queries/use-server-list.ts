import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { QueryOptions } from '@/renderer/lib/react-query';

export const useServerList = (options?: QueryOptions<ServerListResponse>) => {
  // return useQuery({
  //   // onSuccess: (servers) => {
  //   // const { serverUrl } = JSON.parse(
  //   //   localStorage.getItem('authentication') || '{}'
  //   // );
  //   // const storedServersKey = `servers_${md5(serverUrl)}`;
  //   // const serversFromLocalStorage = localStorage.getItem(storedServersKey);
  //   // // If a custom account/token is set for a server, use that instead of the default one
  //   // if (serversFromLocalStorage) {
  //   //   const existingServers = JSON.parse(serversFromLocalStorage);
  //   //   // The 'locked' property determines whether or not to skip updating the server auth
  //   //   const skipped = existingServers.filter(
  //   //     (server: ServerFolderAuth) => server.locked
  //   //   );
  //   //   const store = servers?.data?.flatMap((server) =>
  //   //     server.serverFolders?.map((serverFolder: ServerFolder) => {
  //   //       if (skipped.includes(serverFolder.id)) {
  //   //         return existingServers.find(
  //   //           (s: ServerFolderAuth) => s.id === serverFolder.id
  //   //         );
  //   //       }
  //   //       return {
  //   //         id: serverFolder.id,
  //   //         locked: false,
  //   //         serverId: server.id,
  //   //         token: server.token,
  //   //         type: server.type,
  //   //         url: server.url,
  //   //         userId: server.remoteUserId,
  //   //         username: server.username,
  //   //       };
  //   //     })
  //   //   );
  //   //   return localStorage.setItem(storedServersKey, JSON.stringify(store));
  //   // }
  //   // const store = servers?.data?.flatMap((server) =>
  //   //   server.serverFolders?.map((serverFolder: ServerFolder) => ({
  //   //     id: serverFolder.id,
  //   //     locked: false,
  //   //     serverId: server.id,
  //   //     token: server.token,
  //   //     type: server.type,
  //   //     url: server.url,
  //   //     userId: server.remoteUserId,
  //   //     username: server.username,
  //   //   }))
  //   // );
  //   // return localStorage.setItem(storedServersKey, JSON.stringify(store));
  //   // },
  //   queryFn: () => api.servers.getServerList(),
  //   queryKey: queryKeys.server.list,
  //   ...options,
  // });

  return useQuery({
    queryFn: () => api.servers.getServerList(),
    queryKey: queryKeys.servers.list(),
    ...options,
  });
};
