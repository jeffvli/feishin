import type { ServerListItem } from '../store';
import type { ServerType } from '../types';
import type { JFAlbum, JFAlbumListSort, JFSortOrder } from './jellyfin.types';
import type { NDAlbum, NDAlbumListSort, NDOrder } from './navidrome.types';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ExternalSource {
  LASTFM = 'LASTFM',
  MUSICBRAINZ = 'MUSICBRAINZ',
  SPOTIFY = 'SPOTIFY',
  THEAUDIODB = 'THEAUDIODB',
}

export enum ExternalType {
  ID = 'ID',
  LINK = 'LINK',
}

export enum ImageType {
  BACKDROP = 'BACKDROP',
  LOGO = 'LOGO',
  PRIMARY = 'PRIMARY',
  SCREENSHOT = 'SCREENSHOT',
}

export enum TaskType {
  FULL_SCAN = 'FULL_SCAN',
  LASTFM = 'LASTFM',
  MUSICBRAINZ = 'MUSICBRAINZ',
  QUICK_SCAN = 'QUICK_SCAN',
  REFRESH = 'REFRESH',
  SPOTIFY = 'SPOTIFY',
}

export type EndpointDetails = {
  server: ServerListItem;
};

// export interface BaseResponse<T> {
//   error?: string | any;
//   items: T;
//   response: 'Success' | 'Error';
//   statusCode: number;
// }

export interface BasePaginatedResponse<T> {
  error?: string | any;
  items: T;
  pagination?: {
    startIndex: number;
    totalEntries: number;
  };
}

export type ApiError = {
  error: {
    message: string;
    path: string;
    trace: string[];
  };
  response: string;
  statusCode: number;
};

export type AuthResponse = {
  credential: string;
  ndCredential?: string;
  username: string;
};

// export type NullResponse = BaseResponse<null>;

export type PaginationParams = {
  skip: number;
  take: number;
};

export type RelatedServerFolder = {
  enabled: boolean;
  id: string;
  lastScannedAt: string | null;
  name: string;
};

export type ServerFolder = {
  createdAt: string;
  enabled: boolean;
  id: string;
  lastScannedAt: string | null;
  name: string;
  serverId: string;
  updatedAt: string;
};

export type Genre = {
  albumArtistCount: number;
  albumCount: number;
  artistCount: number;
  id: string;
  name: string;
  songCount: number;
  totalCount: number;
};

export type RelatedGenre = {
  id: string;
  name: string;
};

export type Album = {
  albumArtists: RelatedArtist[];
  artists: RelatedArtist[];
  backdropImageUrl: string | null;
  createdAt: string;
  genres: RelatedGenre[];
  id: string;
  imagePlaceholderUrl: string | null;
  imageUrl: string | null;
  isCompilation: boolean | null;
  isFavorite: boolean;
  name: string;
  playCount: number | null;
  rating: number | null;
  releaseDate: string | null;
  releaseYear: number | null;
  serverType: ServerType;
  size: number | null;
  songCount: number | null;
  songs?: Song[];
  uniqueId: string;
  updatedAt: string;
};

export type Song = {
  album: string;
  albumArtists: RelatedArtist[];
  albumId: string;
  artistName: string;
  artists: RelatedArtist[];
  bitRate: number;
  compilation: boolean | null;
  container: string;
  createdAt: string;
  discNumber: number;
  duration: number;
  genres: RelatedGenre[];
  id: string;
  imageUrl: string;
  isFavorite: boolean;
  name: string;
  releaseDate: string;
  releaseYear: string;
  serverId: string;
  size: number;
  streamUrl: string;
  trackNumber: number;
  type: ServerType;
  uniqueId: string;
  updatedAt: string;
};

export type AlbumArtist = {
  biography: string | null;
  createdAt: string;
  id: string;
  name: string;
  remoteCreatedAt: string | null;
  serverFolderId: string;
  updatedAt: string;
};

export type RelatedAlbumArtist = {
  id: string;
  name: string;
};

export type Artist = {
  biography: string | null;
  createdAt: string;
  id: string;
  name: string;
  remoteCreatedAt: string | null;
  serverFolderId: string;
  updatedAt: string;
};

export type RelatedArtist = {
  id: string;
  name: string;
};

export type RelatedServer = {
  id: string;
  name: string;
  type: ServerType;
  url: string;
};

export type RelatedUser = {
  enabled: boolean;
  id: string;
  isAdmin: boolean;
  username: string;
};

export type Task = {
  createdAt: string;
  id: string;
  isCompleted: boolean;
  isError: boolean;
  message: string;
  server: RelatedServer | null;
  type: TaskType;
  updatedAt: string;
  user: RelatedUser | null;
};

export type AlbumListSort = NDAlbumListSort | JFAlbumListSort;

export type ListSortOrder = NDOrder | JFSortOrder;

export type AlbumListParams = {
  _skip: number;
  _take?: number;
  musicFolderId: string | null;
  nd?: {
    artist_id?: string;
    compilation?: boolean;
    genre_id?: string;
    has_rating?: boolean;
    starred?: boolean;
    year?: number;
  };
  sortBy: NDAlbumListSort | JFAlbumListSort;
  sortOrder: SortOrder;
};

export type AlbumListResponse =
  | BasePaginatedResponse<Album[] | NDAlbum[] | JFAlbum[]>
  | null
  | undefined;

export type AlbumDetailQuery = {
  id: string;
};

export type AlbumDetailResponse = Album | NDAlbum | JFAlbum | null | undefined;

export type Count = {
  artists?: number;
  externals?: number;
  favorites?: number;
  genres?: number;
  images?: number;
  ratings?: number;
  songs?: number;
};
