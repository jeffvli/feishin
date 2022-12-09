import type { ServerListItem } from '/@/store';
import type { ServerType } from '/@//types';
import type { JFAlbumListSort, JFSortOrder } from '/@/api/jellyfin.types';
import type {
  NDAlbumArtistDetail,
  NDAlbumArtistList,
  NDAlbumArtistListSort,
  NDAlbumDetail,
  NDAlbumList,
  NDAlbumListSort,
  NDCreatePlaylist,
  NDDeletePlaylist,
  NDGenreList,
  NDOrder,
  NDPlaylistDetail,
  NDPlaylistList,
  NDPlaylistListSort,
  NDSongDetail,
  NDSongList,
  NDSongListSort,
} from '/@/api/navidrome.types';
import type {
  SSAlbumArtistDetail,
  SSAlbumArtistList,
  SSAlbumDetail,
  SSAlbumList,
} from '/@/api/subsonic.types';

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

export type EndpointDetails = {
  server: ServerListItem;
};

export interface BasePaginatedResponse<T> {
  error?: string | any;
  items: T;
  startIndex: number;
  totalRecordCount: number;
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

export type AuthenticationResponse = {
  credential: string;
  ndCredential?: string;
  userId: string | null;
  username: string;
};

export type Genre = {
  id: string;
  name: string;
};

export type Album = {
  albumArtists: RelatedArtist[];
  artists: RelatedArtist[];
  backdropImageUrl: string | null;
  createdAt: string;
  genres: Genre[];
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
  genres: Genre[];
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

export type MusicFolder = {
  id: string;
  name: string;
};

export type Playlist = {
  duration?: number;
  id: string;
  name: string;
  public?: boolean;
  size?: number;
  songCount?: number;
  userId: string;
  username: string;
};

export type GenresResponse = Genre[];

export type MusicFoldersResponse = MusicFolder[];

export type ListSortOrder = NDOrder | JFSortOrder;

type BaseEndpointArgs = {
  server: ServerListItem | null;
  signal?: AbortSignal;
};

// Genre List ---------------------------------------------------------------------------
export type RawGenreListResponse = NDGenreList | undefined;

export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type GenreListArgs = { query: GenreListQuery } & BaseEndpointArgs;

export type GenreListQuery = null;

// Album List ---------------------------------------------------------------------------
export type RawAlbumListResponse = NDAlbumList | SSAlbumList | undefined;

export type AlbumListResponse = BasePaginatedResponse<Album[]> | null | undefined;

export type AlbumListSort = NDAlbumListSort | JFAlbumListSort;

export type AlbumListQuery = {
  limit?: number;
  musicFolderId?: string;
  ndParams?: {
    artist_id?: string;
    compilation?: boolean;
    genre_id?: string;
    has_rating?: boolean;
    name?: string;
    starred?: boolean;
    year?: number;
  };
  sortBy: AlbumListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type AlbumListArgs = { query: AlbumListQuery } & BaseEndpointArgs;

// Album Detail -------------------------------------------------------------------------
export type RawAlbumDetailResponse = NDAlbumDetail | SSAlbumDetail | undefined;

export type AlbumDetailResponse = Album | null | undefined;

export type AlbumDetailQuery = { id: string };

export type AlbumDetailArgs = { query: AlbumDetailQuery } & BaseEndpointArgs;

// Song List ----------------------------------------------------------------------------
export type RawSongListResponse = NDSongList | undefined;

export type SongListResponse = BasePaginatedResponse<Song[]>;

export type SongListSort = NDSongListSort;

export type SongListQuery = {
  limit?: number;
  musicFolderId?: string;
  ndParams?: {
    artist_id?: string;
    compilation?: boolean;
    genre_id?: string;
    has_rating?: boolean;
    starred?: boolean;
    title?: string;
    year?: number;
  };
  sortBy: SongListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type SongListArgs = { query: SongListQuery } & BaseEndpointArgs;

// Song Detail  -------------------------------------------------------------------------
export type RawSongDetailResponse = NDSongDetail | undefined;

export type SongDetailResponse = Song | null | undefined;

export type SongDetailQuery = { id: string };

export type SongDetailArgs = { query: SongDetailQuery } & BaseEndpointArgs;

// Album Artist List  -------------------------------------------------------------------
export type RawAlbumArtistListResponse = NDAlbumArtistList | SSAlbumArtistList | undefined;

export type AlbumArtistListResponse = BasePaginatedResponse<AlbumArtist[]>;

export type AlbumArtistListSort = NDAlbumArtistListSort;

export type AlbumArtistListQuery = {
  limit?: number;
  musicFolderId?: string;
  ndParams?: {
    genre_id?: string;
    name?: string;
    starred?: boolean;
  };
  sortBy: AlbumArtistListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type AlbumArtistListArgs = { query: AlbumArtistListQuery } & BaseEndpointArgs;

// Album Artist Detail  -----------------------------------------------------------------
export type RawAlbumArtistDetailResponse = NDAlbumArtistDetail | SSAlbumArtistDetail | undefined;

export type AlbumArtistDetailResponse = BasePaginatedResponse<AlbumArtist[]>;

export type AlbumArtistDetailQuery = { id: string };

export type AlbumArtistDetailArgs = { query: AlbumArtistDetailQuery } & BaseEndpointArgs;

// Artist List  -------------------------------------------------------------------------

// Artist Detail  -----------------------------------------------------------------------

// Favorite  ----------------------------------------------------------------------------
export type RawFavoriteResponse = null | undefined;

export type FavoriteResponse = null;

export type FavoriteQuery = { id: string; type?: 'song' | 'album' | 'albumArtist' };

export type FavoriteArgs = { query: FavoriteQuery } & BaseEndpointArgs;

// Rating  -------------------------------------------------------------------------------
export type RawRatingResponse = null | undefined;

export type RatingResponse = null;

export type RatingQuery = { id: string; rating: number };

export type RatingArgs = { query: RatingQuery } & BaseEndpointArgs;

// Create Playlist -----------------------------------------------------------------------
export type RawCreatePlaylistResponse = NDCreatePlaylist | undefined;

export type CreatePlaylistResponse = null;

export type CreatePlaylistQuery = { comment?: string; name: string; public?: boolean };

export type CreatePlaylistArgs = { query: CreatePlaylistQuery } & BaseEndpointArgs;

// Delete Playlist -----------------------------------------------------------------------
export type RawDeletePlaylistResponse = NDDeletePlaylist | undefined;

export type DeletePlaylistResponse = null;

export type DeletePlaylistQuery = { id: string };

export type DeletePlaylistArgs = { query: DeletePlaylistQuery } & BaseEndpointArgs;

// Playlist List -------------------------------------------------------------------------
export type RawPlaylistListResponse = NDPlaylistList | undefined;

export type PlaylistListResponse = BasePaginatedResponse<Playlist[]>;

export type PlaylistListSort = NDPlaylistListSort;

export type PlaylistListQuery = {
  limit?: number;
  musicFolderId?: string;
  sortBy: PlaylistListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type PlaylistListArgs = { query: PlaylistListQuery } & BaseEndpointArgs;

// Playlist Detail -----------------------------------------------------------------------
export type RawPlaylistDetailResponse = NDPlaylistDetail | undefined;

export type PlaylistDetailResponse = BasePaginatedResponse<Playlist[]>;

export type PlaylistDetailQuery = {
  id: string;
};

export type PlaylistDetailArgs = { query: PlaylistDetailQuery } & BaseEndpointArgs;
