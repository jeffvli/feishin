export enum ServerType {
  JELLYFIN = 'JELLYFIN',
  NAVIDROME = 'NAVIDROME',
  SUBSONIC = 'SUBSONIC',
}

export enum ServerPermissionType {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
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

export interface BaseResponse<T> {
  data: T;
  error?: string | any;
  response: 'Success' | 'Error';
  statusCode: number;
}

export interface BasePaginatedResponse<T> {
  data: T;
  error?: string | any;
  pagination: {
    nextPage: string | null;
    prevPage: string | null;
    startIndex: number;
    totalEntries: number;
  };
  response: 'Success' | 'Error';
  statusCode: number;
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

export type NullResponse = BaseResponse<null>;

export type PaginationParams = {
  skip: number;
  take: number;
};

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type Server = {
  createdAt: string;
  id: string;
  name: string;
  noCredential: boolean;
  remoteUserId: string;
  serverFolders?: RelatedServerFolder[];
  serverPermissions?: RelatedServerPermission[];
  serverUrls?: RelatedServerUrl[];
  token?: string;
  type: ServerType;
  updatedAt: string;
  url: string;
  username: string;
};

export type RelatedServerFolder = {
  enabled: boolean;
  id: string;
  lastScannedAt: string | null;
  name: string;
  remoteId: string;
};

export type ServerFolder = {
  createdAt: string;
  enabled: boolean;
  id: string;
  lastScannedAt: string | null;
  name: string;
  remoteId: string;
  serverId: string;
  updatedAt: string;
};

export type ServerUrl = {
  createdAt: string;
  id: string;
  serverId: string;
  updatedAt: string;
  url: string;
};

export type RelatedServerUrl = {
  enabled: boolean;
  id: string;
  url: string;
};

export type RelatedServerPermission = {
  id: string;
  type: ServerPermissionType;
};

export type ServerFile = {
  id: string;
  mimetype: string;
  name: string;
  path: string;
  type: string;
};

export type User = {
  avatar: ServerFile | null;
  createdAt: string;
  displayName?: string;
  enabled: boolean;
  flatServerPermissions: string[];
  id: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  password?: string;
  serverFolderPermissions: ServerFolderPermission[];
  serverPermissions: ServerPermission[];
  updatedAt: string;
  username: string;
};

export type ServerFolderPermission = {
  createdAt: string;
  id: string;
  serverFolderId: string;
  updatedAt: string;
};

export type ServerPermission = {
  createdAt: string;
  id: string;
  serverId: string;
  type: ServerPermissionType;
  updatedAt: string;
};

export type Login = {
  accessToken: string;
  refreshToken: string;
} & User;

export type Ping = {
  description: string;
  name: string;
  version: string;
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

export type External = {
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
  url: string;
};

export type Image = {
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
  url: string;
};

export type Album = {
  albumArtists: RelatedArtist[];
  artists: RelatedArtist[];
  backdropImageUrl: string | null;
  createdAt: string;
  deleted: boolean;
  genres: RelatedGenre[];
  id: string;
  imageUrl: string | null;
  isFavorite: boolean;
  name: string;
  rating: number | null;
  releaseDate: string | null;
  releaseYear: number | null;
  remoteCreatedAt: string;
  remoteId: string;
  serverFolders: RelatedServerFolder[];
  songcount: number;
  songs?: Song[];
  sortName: string;
  type: ServerType;
  updatedAt: string;
};

export type Song = {
  album: Album;
  artistName: string;
  artists: RelatedArtist[];
  bitRate: number;
  container: string;
  createdAt: string;
  deleted: boolean;
  discNumber: number;
  duration: number;
  genres: RelatedGenre[];
  id: string;
  imageUrl: string;
  name: string;
  releaseDate: string;
  releaseYear: string;
  remoteCreatedAt: string;
  remoteId: string;
  serverFolderId: string;
  serverId: string;
  streamUrl: string;
  trackNumber: number;
  updatedAt: string;
};

export type AlbumArtist = {
  biography: string | null;
  createdAt: string;
  id: string;
  name: string;
  remoteCreatedAt: string | null;
  remoteId: string;
  serverFolderId: string;
  updatedAt: string;
};

export type RelatedAlbumArtist = {
  id: string;
  name: string;
  remoteId: string;
};

export type Artist = {
  biography: string | null;
  createdAt: string;
  id: string;
  name: string;
  remoteCreatedAt: string | null;
  remoteId: string;
  serverFolderId: string;
  updatedAt: string;
};

export type RelatedArtist = {
  id: string;
  name: string;
  remoteId: string;
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

export type PingResponse = BaseResponse<Ping>;

export type LoginResponse = BaseResponse<Login>;

export type AlbumDetailResponse = BaseResponse<Album>;

export type AlbumListResponse = BasePaginatedResponse<Album[]>;

export type Count = {
  artists?: number;
  externals?: number;
  favorites?: number;
  genres?: number;
  images?: number;
  ratings?: number;
  songs?: number;
};
