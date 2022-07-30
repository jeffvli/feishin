export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum AlbumFilter {
  FAVORITED,
  NOT_FAVORITED,
}

export type Server = {
  createdAt: Date | string;
  id: number;
  name: string;
  remoteUserId: string;
  serverFolder?: ServerFolder[];
  serverType: string;
  token: string;
  updatedAt: Date | string;
  url: string;
  username: string;
};

export type ServerFolder = {
  createdAt: Date | string;
  enabled: boolean;
  id: number;
  name: string;
  remoteId: string;
  serverId: number;
  updatedAt: Date | string;
};

export type Rating = {
  albumArtistId?: number;
  albumId?: number;
  artistId?: number;
  createdAt: Date | string;
  id: number;
  songId?: number;
  updatedAt: Date | string;
  userId: number;
  value: number;
};

export type User = {
  createdAt: Date | string;
  deviceId: string;
  enabled: boolean;
  id: number;
  isAdmin: boolean;
  password?: string;
  updatedAt: Date | string;
  username: string;
};

export type Genre = {
  createdAt: Date | string;
  id: number;
  name: string;
  updatedAt: Date | string;
};

export type Artist = {
  biography: string;
  createdAt: Date | string;
  favorite?: boolean;
  genres?: Genre[];
  id: number;
  imageUrl?: string;
  name: string;
  rating?: number;
  remoteCreatedAt: string;
  remoteId: string;

  updatedAt: Date | string;
};

export type Album = {
  biography?: string;
  createdAt: Date | string;
  favorite?: boolean;
  id: number;
  imageUrl?: string;
  name: string;
  rating?: number;
  remoteCreatedAt: string;
  remoteId: string;
  updatedAt: Date | string;
};

export type Song = {
  createdAt: Date | string;
  favorite?: boolean;
  id: number;
  imageUrl?: string;
  name: string;
  rating?: number;
  remoteCreatedAt: string;
  remoteId: string;
  updatedAt: Date | string;
};

export type Task = {
  completed: boolean;
  createdAt: Date | string;
  id: number;
  inProgress: boolean;
  isError: boolean | null;
  message: string | null;
  name: string;
  updatedAt: Date | string;
};

export type OffsetPagination = {
  skip: number;
  take: number;
};

export type PaginationResponse = {
  currentPage: number;
  nextPage: string;
  prevPage: string;
  startIndex: number;
  totalEntries: number;
};

export type SuccessResponse = {
  data: any;
  paginationItems?: PaginationItems;
};

export type PaginationItems = {
  skip: number;
  take: number;
  totalEntries: number;
  url: string;
};
