import { QueryFunctionContext } from '@tanstack/react-query';
import type {
  AlbumListQuery,
  SongListQuery,
  AlbumDetailQuery,
  AlbumArtistListQuery,
  ArtistListQuery,
  PlaylistListQuery,
  PlaylistDetailQuery,
  PlaylistSongListQuery,
  UserListQuery,
  AlbumArtistDetailQuery,
  TopSongListQuery,
  SearchQuery,
  SongDetailQuery,
  RandomSongListQuery,
  LyricsQuery,
} from './types';

export const queryKeys: Record<
  string,
  Record<string, (...props: any) => QueryFunctionContext['queryKey']>
> = {
  albumArtists: {
    detail: (serverId: string, query?: AlbumArtistDetailQuery) => {
      if (query) return [serverId, 'albumArtists', 'detail', query] as const;
      return [serverId, 'albumArtists', 'detail'] as const;
    },
    list: (serverId: string, query?: AlbumArtistListQuery) => {
      if (query) return [serverId, 'albumArtists', 'list', query] as const;
      return [serverId, 'albumArtists', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'albumArtists'] as const,
    topSongs: (serverId: string, query?: TopSongListQuery) => {
      if (query) return [serverId, 'albumArtists', 'topSongs', query] as const;
      return [serverId, 'albumArtists', 'topSongs'] as const;
    },
  },
  albums: {
    detail: (serverId: string, query?: AlbumDetailQuery) =>
      [serverId, 'albums', 'detail', query] as const,
    list: (serverId: string, query?: AlbumListQuery) => {
      if (query) return [serverId, 'albums', 'list', query] as const;
      return [serverId, 'albums', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'albums'],
    serverRoot: (serverId: string) => [serverId, 'albums'],
    songs: (serverId: string, query: SongListQuery) =>
      [serverId, 'albums', 'songs', query] as const,
  },
  artists: {
    list: (serverId: string, query?: ArtistListQuery) => {
      if (query) return [serverId, 'artists', 'list', query] as const;
      return [serverId, 'artists', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'artists'] as const,
  },
  genres: {
    list: (serverId: string) => [serverId, 'genres', 'list'] as const,
    root: (serverId: string) => [serverId, 'genres'] as const,
  },
  musicFolders: {
    list: (serverId: string) => [serverId, 'musicFolders', 'list'] as const,
  },
  playlists: {
    detail: (serverId: string, id?: string, query?: PlaylistDetailQuery) => {
      if (query) return [serverId, 'playlists', id, 'detail', query] as const;
      if (id) return [serverId, 'playlists', id, 'detail'] as const;
      return [serverId, 'playlists', 'detail'] as const;
    },
    detailSongList: (serverId: string, id: string, query?: PlaylistSongListQuery) => {
      if (query) return [serverId, 'playlists', id, 'detailSongList', query] as const;
      if (id) return [serverId, 'playlists', id, 'detailSongList'] as const;
      return [serverId, 'playlists', 'detailSongList'] as const;
    },
    list: (serverId: string, query?: PlaylistListQuery) => {
      if (query) return [serverId, 'playlists', 'list', query] as const;
      return [serverId, 'playlists', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'playlists'] as const,
    songList: (serverId: string, id?: string, query?: PlaylistSongListQuery) => {
      if (query && id) return [serverId, 'playlists', id, 'songList', query] as const;
      if (id) return [serverId, 'playlists', id, 'songList'] as const;
      return [serverId, 'playlists', 'songList'] as const;
    },
  },
  search: {
    list: (serverId: string, query?: SearchQuery) => {
      if (query) return [serverId, 'search', 'list', query] as const;
      return [serverId, 'search', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'search'] as const,
  },
  server: {
    root: (serverId: string) => [serverId] as const,
  },
  songs: {
    detail: (serverId: string, query?: SongDetailQuery) => {
      if (query) return [serverId, 'songs', 'detail', query] as const;
      return [serverId, 'songs', 'detail'] as const;
    },
    list: (serverId: string, query?: SongListQuery) => {
      if (query) return [serverId, 'songs', 'list', query] as const;
      return [serverId, 'songs', 'list'] as const;
    },
    lyrics: (serverId: string, query?: LyricsQuery) => {
      if (query) return [serverId, 'song', 'lyrics', query] as const;
      return [serverId, 'song', 'lyrics'] as const;
    },
    randomSongList: (serverId: string, query?: RandomSongListQuery) => {
      if (query) return [serverId, 'songs', 'randomSongList', query] as const;
      return [serverId, 'songs', 'randomSongList'] as const;
    },
    root: (serverId: string) => [serverId, 'songs'] as const,
  },
  users: {
    list: (serverId: string, query?: UserListQuery) => {
      if (query) return [serverId, 'users', 'list', query] as const;
      return [serverId, 'users', 'list'] as const;
    },
    root: (serverId: string) => [serverId, 'users'] as const,
  },
};
