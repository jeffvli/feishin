import { AlbumListParams } from './albums.api';

export const queryKeys = {
  albums: {
    detail: (albumId: string) => ['albums', albumId] as const,
    list: (params: AlbumListParams) => ['albums', 'list', params] as const,
    root: ['albums'],
    songList: (albumId: string) => ['albums', albumId, 'songs'] as const,
  },
  ping: (url: string) => ['ping', url] as const,
  servers: {
    list: () => ['servers', 'list'] as const,
  },
  users: {
    detail: (userId: string) => ['users', userId] as const,
    list: (params: any) => ['users', 'list', params] as const,
    root: ['users'],
  },
};
