import { AlbumsRequest } from './albumsApi';

export const queryKeys = {
  album: (albumId: number) => ['album', albumId] as const,
  albums: (params: AlbumsRequest) => ['albums', params] as const,
  ping: (url: string) => ['ping', url] as const,
  servers: ['servers'] as const,
};
