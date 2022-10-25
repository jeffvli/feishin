export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Item {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  FOLDER = 'folder',
  GENRE = 'genre',
  PLAYLIST = 'playlist',
  SONG = 'song',
}

export enum AlbumFilter {
  FAVORITED,
  NOT_FAVORITED,
}

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
