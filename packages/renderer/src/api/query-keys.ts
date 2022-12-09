import type { AlbumListQuery } from './types';
import type { AlbumDetailQuery } from './types';

export const queryKeys = {
  albums: {
    detail: (serverId: string, query: AlbumDetailQuery) => ['albums', serverId, query] as const,
    list: (serverId: string, params: AlbumListQuery) =>
      [serverId, 'albums', 'list', serverId, params] as const,
    root: ['albums'],
  },
  genres: {
    list: (serverId: string) => [serverId, 'genres', 'list'] as const,
    root: (serverId: string) => [serverId, 'genres'] as const,
  },
  ping: (url: string) => ['ping', url] as const,
  server: {
    root: (serverId: string) => [serverId] as const,
  },
  servers: {
    list: (params?: any) => ['servers', 'list', params] as const,
    map: () => ['servers', 'map'] as const,
    root: ['servers'],
  },
  tasks: {
    list: () => ['tasks', 'list'] as const,
    root: ['tasks'],
  },
  users: {
    detail: (userId: string) => ['users', userId] as const,
    list: (params?: any) => ['users', 'list', params] as const,
    root: ['users'],
  },
};
