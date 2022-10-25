export type NDAuthenticate = {
  id: string;
  isAdmin: boolean;
  name: string;
  subsonicSalt: string;
  subsonicToken: string;
  token: string;
  username: string;
};

export type NDGenre = {
  id: string;
  name: string;
};

export type NDAlbum = {
  albumArtist: string;
  albumArtistId: string;
  allArtistIds: string;
  artist: string;
  artistId: string;
  compilation: boolean;
  coverArtId: string;
  coverArtPath: string;
  createdAt: string;
  duration: number;
  fullText: string;
  genre: string;
  genres: NDGenre[];
  id: string;
  maxYear: number;
  mbzAlbumArtistId: string;
  mbzAlbumId: string;
  minYear: number;
  name: string;
  orderAlbumArtistName: string;
  orderAlbumName: string;
  playCount: number;
  playDate: string;
  rating: number;
  size: number;
  songCount: number;
  sortAlbumArtistName: string;
  sortArtistName: string;
  starred: boolean;
  starredAt: string;
  updatedAt: string;
};

export type NDSong = {
  album: string;
  albumArtist: string;
  albumArtistId: string;
  albumId: string;
  artist: string;
  artistId: string;
  bitRate: number;
  bookmarkPosition: number;
  channels: number;
  compilation: boolean;
  createdAt: string;
  discNumber: number;
  duration: number;
  fullText: string;
  genre: string;
  genres: NDGenre[];
  hasCoverArt: boolean;
  id: string;
  mbzAlbumArtistId: string;
  mbzAlbumId: string;
  mbzArtistId: string;
  mbzTrackId: string;
  orderAlbumArtistName: string;
  orderAlbumName: string;
  orderArtistName: string;
  orderTitle: string;
  path: string;
  playCount: number;
  playDate: string;
  rating: number;
  size: number;
  sortAlbumArtistName: string;
  sortArtistName: string;
  starred: boolean;
  starredAt: string;
  suffix: string;
  title: string;
  trackNumber: number;
  updatedAt: string;
  year: number;
};

export type NDArtist = {
  albumCount: number;
  biography: string;
  externalInfoUpdatedAt: string;
  externalUrl: string;
  fullText: string;
  genres: NDGenre[];
  id: string;
  largeImageUrl: string;
  mbzArtistId: string;
  mediumImageUrl: string;
  name: string;
  orderArtistName: string;
  playCount: number;
  playDate: string;
  rating: number;
  size: number;
  smallImageUrl: string;
  songCount: number;
  starred: boolean;
  starredAt: string;
};

export type NDGenreListResponse = NDGenre[];

export type NDAlbumListResponse = NDAlbum[];

export type NDSongListResponse = NDSong[];

export type NDArtistListResponse = NDArtist[];

export type NDPagination = {
  _end?: number;
  _start?: number;
};

export type NDOrder = {
  _order?: 'ASC' | 'DESC';
};

export enum NDGenreSort {
  NAME = 'name',
}

export type NDGenreListParams = {
  _sort?: NDGenreSort;
  id?: string;
} & NDPagination &
  NDOrder;

export enum NDAlbumSort {
  ARTIST = 'artist',
  MAX_YEAR = 'max_year',
  NAME = 'name',
  RANDOM = 'random',
  RECENTLY_ADDED = 'recently_added',
}

export type NDAlbumListParams = {
  _sort?: NDAlbumSort;
  artist_id?: string;
  compilation?: boolean;
  genre_id?: string;
  has_rating?: boolean;
  id?: string;
  name?: string;
  recently_played?: boolean;
  starred?: boolean;
  year?: number;
} & NDPagination &
  NDOrder;

export type NDSongListParams = {
  genre_id?: string;
  starred?: boolean;
} & NDPagination &
  NDOrder;
