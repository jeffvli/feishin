export interface SSBaseResponse {
  serverVersion?: 'string';
  status: 'string';
  type?: 'string';
  version: 'string';
}

export interface SSMusicFoldersResponse extends SSBaseResponse {
  musicFolders: {
    musicFolder: SSMusicFolder[];
  };
}

export interface SSGenresResponse extends SSBaseResponse {
  genres: {
    genre: SSGenre[];
  };
}

export interface SSArtistsResponse extends SSBaseResponse {
  artists: {
    ignoredArticles: string;
    index: SSArtistIndex[];
    lastModified: number;
  };
}

export interface SSAlbumListResponse extends SSBaseResponse {
  albumList2: {
    album: SSAlbumListEntry[];
  };
}

export interface SSAlbumResponse extends SSBaseResponse {
  album: SSAlbum;
}

export interface SSArtistInfoResponse extends SSBaseResponse {
  artistInfo2: SSArtistInfo;
}

export interface SSArtistInfo {
  biography: string;
  largeImageUrl?: string;
  lastFmUrl?: string;
  mediumImageUrl?: string;
  musicBrainzId?: string;
  smallImageUrl?: string;
}

export interface SSMusicFolder {
  id: number;
  name: string;
}

export interface SSGenre {
  albumCount?: number;
  songCount?: number;
  value: string;
}

export interface SSArtistIndex {
  artist: SSArtistListEntry[];
  name: string;
}

export interface SSArtistListEntry {
  albumCount: string;
  artistImageUrl?: string;
  coverArt?: string;
  id: string;
  name: string;
}

export interface SSAlbumListEntry {
  album: string;
  artist: string;
  artistId: string;
  coverArt: string;
  created: string;
  duration: number;
  genre?: string;
  id: string;
  isDir: boolean;
  isVideo: boolean;
  name: string;
  parent: string;
  songCount: number;
  starred?: boolean;
  title: string;
  userRating?: number;
  year: number;
}

export interface SSAlbum extends SSAlbumListEntry {
  song: SSSong[];
}

export interface SSSong {
  album: string;
  albumId: string;
  artist: string;
  artistId?: string;
  bitRate: number;
  contentType: string;
  coverArt: string;
  created: string;
  discNumber?: number;
  duration: number;
  genre: string;
  id: string;
  isDir: boolean;
  isVideo: boolean;
  parent: string;
  path: string;
  playCount: number;
  size: number;
  starred?: boolean;
  suffix: string;
  title: string;
  track: number;
  type: string;
  userRating?: number;
  year: number;
}

export interface SSAlbumsParams {
  fromYear?: number;
  genre?: string;
  musicFolderId?: string;
  offset?: number;
  size?: number;
  toYear?: number;
  type: string;
}

export interface SSArtistsParams {
  musicFolderId?: number;
}
