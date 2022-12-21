import type { AlbumListQuery, SongListQuery, AlbumDetailQuery } from './types';

export const queryKeys = {
  albums: {
    detail: (serverId: string, query: AlbumDetailQuery) =>
      [serverId, 'albums', 'detail', query] as const,
    list: (serverId: string, query: AlbumListQuery) => [serverId, 'albums', 'list', query] as const,
    root: ['albums'],
    serverRoot: (serverId: string) => [serverId, 'albums'],
    songs: (serverId: string, query: SongListQuery) =>
      [serverId, 'albums', 'songs', query] as const,
  },
  genres: {
    list: (serverId: string) => [serverId, 'genres', 'list'] as const,
    root: (serverId: string) => [serverId, 'genres'] as const,
  },
  musicFolders: {
    list: (serverId: string) => [serverId, 'musicFolders', 'list'] as const,
  },
  server: {
    root: (serverId: string) => [serverId] as const,
  },
  songs: {
    list: (serverId: string, query: SongListQuery) => [serverId, 'songs', 'list', query] as const,
  },
};
