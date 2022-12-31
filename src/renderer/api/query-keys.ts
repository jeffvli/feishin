import type {
  AlbumListQuery,
  SongListQuery,
  AlbumDetailQuery,
  AlbumArtistListQuery,
  ArtistListQuery,
} from './types';

export const queryKeys = {
  albumArtists: {
    list: (serverId: string, query?: AlbumArtistListQuery) =>
      [serverId, 'albumArtists', 'list', query] as const,
    root: (serverId: string) => [serverId, 'albumArtists'] as const,
  },
  albums: {
    detail: (serverId: string, query?: AlbumDetailQuery) =>
      [serverId, 'albums', 'detail', query] as const,
    list: (serverId: string, query?: AlbumListQuery) =>
      [serverId, 'albums', 'list', query] as const,
    root: (serverId: string) => [serverId, 'albums'],
    serverRoot: (serverId: string) => [serverId, 'albums'],
    songs: (serverId: string, query: SongListQuery) =>
      [serverId, 'albums', 'songs', query] as const,
  },
  artists: {
    list: (serverId: string, query?: ArtistListQuery) =>
      [serverId, 'artists', 'list', query] as const,
    root: (serverId: string) => [serverId, 'artists'] as const,
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
    list: (serverId: string, query?: SongListQuery) => [serverId, 'songs', 'list', query] as const,
    root: (serverId: string) => [serverId, 'songs'] as const,
  },
};
