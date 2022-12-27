import {
  JFSortOrder,
  JFGenreList,
  JFAlbumList,
  JFAlbumListSort,
  JFAlbumDetail,
  JFSongList,
  JFSongListSort,
  JFAlbumArtistList,
  JFAlbumArtistListSort,
  JFAlbumArtistDetail,
  JFArtistList,
  JFArtistListSort,
  JFPlaylistList,
  JFPlaylistDetail,
  JFMusicFolderList,
} from '/@/renderer/api/jellyfin.types';
import {
  NDSortOrder,
  NDOrder,
  NDGenreList,
  NDAlbumList,
  NDAlbumListSort,
  NDAlbumDetail,
  NDSongList,
  NDSongListSort,
  NDSongDetail,
  NDAlbumArtistList,
  NDAlbumArtistListSort,
  NDAlbumArtistDetail,
  NDDeletePlaylist,
  NDPlaylistList,
  NDPlaylistListSort,
  NDPlaylistDetail,
} from '/@/renderer/api/navidrome.types';
import {
  SSAlbumList,
  SSAlbumDetail,
  SSAlbumArtistList,
  SSAlbumArtistDetail,
  SSMusicFolderList,
  SSGenreList,
} from '/@/renderer/api/subsonic.types';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type ServerListItem = {
  credential: string;
  id: string;
  name: string;
  ndCredential?: string;
  type: ServerType;
  url: string;
  userId: string | null;
  username: string;
};

export enum ServerType {
  JELLYFIN = 'jellyfin',
  NAVIDROME = 'navidrome',
  SUBSONIC = 'subsonic',
}

export type QueueSong = Song & {
  uniqueId: string;
};

type SortOrderMap = {
  jellyfin: Record<SortOrder, JFSortOrder>;
  navidrome: Record<SortOrder, NDSortOrder>;
  subsonic: Record<SortOrder, undefined>;
};

export const sortOrderMap: SortOrderMap = {
  jellyfin: {
    ASC: JFSortOrder.ASC,
    DESC: JFSortOrder.DESC,
  },
  navidrome: {
    ASC: NDSortOrder.ASC,
    DESC: NDSortOrder.DESC,
  },
  subsonic: {
    ASC: undefined,
    DESC: undefined,
  },
};

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
  duration: number | null;
  genres: Genre[];
  id: string;
  imagePlaceholderUrl: string | null;
  imageUrl: string | null;
  isCompilation: boolean | null;
  isFavorite: boolean;
  lastPlayedAt: string | null;
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
  bpm: number | null;
  channels: number | null;
  compilation: boolean | null;
  container: string | null;
  createdAt: string;
  discNumber: number;
  duration: number;
  genres: Genre[];
  id: string;
  imageUrl: string | null;
  isFavorite: boolean;
  lastPlayedAt: string | null;
  name: string;
  note: string | null;
  path: string | null;
  playCount: number;
  releaseDate: string | null;
  releaseYear: string | null;
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

// Genre List
export type RawGenreListResponse = NDGenreList | JFGenreList | SSGenreList | undefined;

export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type GenreListArgs = { query: GenreListQuery } & BaseEndpointArgs;

export type GenreListQuery = null;

// Album List
export type RawAlbumListResponse = NDAlbumList | SSAlbumList | JFAlbumList | undefined;

export type AlbumListResponse = BasePaginatedResponse<Album[]> | null | undefined;

export enum AlbumListSort {
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  COMMUNITY_RATING = 'communityRating',
  CRITIC_RATING = 'criticRating',
  DURATION = 'duration',
  FAVORITED = 'favorited',
  NAME = 'name',
  PLAY_COUNT = 'playCount',
  RANDOM = 'random',
  RATING = 'rating',
  RECENTLY_ADDED = 'recentlyAdded',
  RECENTLY_PLAYED = 'recentlyPlayed',
  RELEASE_DATE = 'releaseDate',
  SONG_COUNT = 'songCount',
  YEAR = 'year',
}

export type AlbumListQuery = {
  jfParams?: {
    albumArtistIds?: string;
    artistIds?: string;
    filters?: string;
    genreIds?: string;
    genres?: string;
    isFavorite?: boolean;
    maxYear?: number; // Parses to years
    minYear?: number; // Parses to years
    tags?: string;
  };
  limit?: number;
  musicFolderId?: string;
  ndParams?: {
    artist_id?: string;
    compilation?: boolean;
    genre_id?: string;
    has_rating?: boolean;
    name?: string;
    recently_played?: boolean;
    starred?: boolean;
    year?: number;
  };
  searchTerm?: string;
  sortBy: AlbumListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type AlbumListArgs = { query: AlbumListQuery } & BaseEndpointArgs;

type AlbumListSortMap = {
  jellyfin: Record<AlbumListSort, JFAlbumListSort | undefined>;
  navidrome: Record<AlbumListSort, NDAlbumListSort | undefined>;
  subsonic: Record<AlbumListSort, undefined>;
};

export const albumListSortMap: AlbumListSortMap = {
  jellyfin: {
    albumArtist: JFAlbumListSort.ALBUM_ARTIST,
    artist: undefined,
    communityRating: JFAlbumListSort.COMMUNITY_RATING,
    criticRating: JFAlbumListSort.CRITIC_RATING,
    duration: undefined,
    favorited: undefined,
    name: JFAlbumListSort.NAME,
    playCount: undefined,
    random: JFAlbumListSort.RANDOM,
    rating: undefined,
    recentlyAdded: JFAlbumListSort.RECENTLY_ADDED,
    recentlyPlayed: undefined,
    releaseDate: JFAlbumListSort.RELEASE_DATE,
    songCount: undefined,
    year: undefined,
  },
  navidrome: {
    albumArtist: NDAlbumListSort.ALBUM_ARTIST,
    artist: NDAlbumListSort.ARTIST,
    communityRating: undefined,
    criticRating: undefined,
    duration: NDAlbumListSort.DURATION,
    favorited: NDAlbumListSort.STARRED,
    name: NDAlbumListSort.NAME,
    playCount: NDAlbumListSort.PLAY_COUNT,
    random: NDAlbumListSort.RANDOM,
    rating: NDAlbumListSort.RATING,
    recentlyAdded: NDAlbumListSort.RECENTLY_ADDED,
    recentlyPlayed: NDAlbumListSort.PLAY_DATE,
    releaseDate: undefined,
    songCount: NDAlbumListSort.SONG_COUNT,
    year: NDAlbumListSort.YEAR,
  },
  subsonic: {
    albumArtist: undefined,
    artist: undefined,
    communityRating: undefined,
    criticRating: undefined,
    duration: undefined,
    favorited: undefined,
    name: undefined,
    playCount: undefined,
    random: undefined,
    rating: undefined,
    recentlyAdded: undefined,
    recentlyPlayed: undefined,
    releaseDate: undefined,
    songCount: undefined,
    year: undefined,
  },
};

// Album Detail
export type RawAlbumDetailResponse = NDAlbumDetail | SSAlbumDetail | JFAlbumDetail | undefined;

export type AlbumDetailResponse = Album | null | undefined;

export type AlbumDetailQuery = { id: string };

export type AlbumDetailArgs = { query: AlbumDetailQuery } & BaseEndpointArgs;

// Song List
export type RawSongListResponse = NDSongList | JFSongList | undefined;

export type SongListResponse = BasePaginatedResponse<Song[]>;

export enum SongListSort {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  BPM = 'bpm',
  CHANNELS = 'channels',
  COMMENT = 'comment',
  DURATION = 'duration',
  FAVORITED = 'favorited',
  GENRE = 'genre',
  NAME = 'name',
  PLAY_COUNT = 'playCount',
  RANDOM = 'random',
  RATING = 'rating',
  RECENTLY_ADDED = 'recentlyAdded',
  RECENTLY_PLAYED = 'recentlyPlayed',
  RELEASE_DATE = 'releaseDate',
  YEAR = 'year',
}

export type SongListQuery = {
  jfParams?: {
    filters?: string;
    genreIds?: string;
    genres?: string;
    includeItemTypes: 'Audio';
    isFavorite?: boolean;
    maxYear?: number; // Parses to years
    minYear?: number; // Parses to years
    sortBy?: JFSongListSort;
    years?: string;
  };
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
  searchTerm?: string;
  sortBy: SongListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type SongListArgs = { query: SongListQuery } & BaseEndpointArgs;

type SongListSortMap = {
  jellyfin: Record<SongListSort, JFSongListSort | undefined>;
  navidrome: Record<SongListSort, NDSongListSort | undefined>;
  subsonic: Record<SongListSort, undefined>;
};

export const songListSortMap: SongListSortMap = {
  jellyfin: {
    album: JFSongListSort.ALBUM,
    albumArtist: JFSongListSort.ALBUM_ARTIST,
    artist: JFSongListSort.ARTIST,
    bpm: undefined,
    channels: undefined,
    comment: undefined,
    duration: JFSongListSort.DURATION,
    favorited: undefined,
    genre: undefined,
    name: JFSongListSort.NAME,
    playCount: JFSongListSort.PLAY_COUNT,
    random: JFSongListSort.RANDOM,
    rating: undefined,
    recentlyAdded: JFSongListSort.RECENTLY_ADDED,
    recentlyPlayed: JFSongListSort.RECENTLY_PLAYED,
    releaseDate: JFSongListSort.RELEASE_DATE,
    year: undefined,
  },
  navidrome: {
    album: NDSongListSort.ALBUM,
    albumArtist: NDSongListSort.ALBUM_ARTIST,
    artist: NDSongListSort.ARTIST,
    bpm: NDSongListSort.BPM,
    channels: NDSongListSort.CHANNELS,
    comment: NDSongListSort.COMMENT,
    duration: NDSongListSort.DURATION,
    favorited: NDSongListSort.FAVORITED,
    genre: NDSongListSort.GENRE,
    name: NDSongListSort.TITLE,
    playCount: NDSongListSort.PLAY_COUNT,
    random: undefined,
    rating: NDSongListSort.RATING,
    recentlyAdded: NDSongListSort.PLAY_DATE,
    recentlyPlayed: NDSongListSort.PLAY_DATE,
    releaseDate: undefined,
    year: NDSongListSort.YEAR,
  },
  subsonic: {
    album: undefined,
    albumArtist: undefined,
    artist: undefined,
    bpm: undefined,
    channels: undefined,
    comment: undefined,
    duration: undefined,
    favorited: undefined,
    genre: undefined,
    name: undefined,
    playCount: undefined,
    random: undefined,
    rating: undefined,
    recentlyAdded: undefined,
    recentlyPlayed: undefined,
    releaseDate: undefined,
    year: undefined,
  },
};

// Song Detail
export type RawSongDetailResponse = NDSongDetail | undefined;

export type SongDetailResponse = Song | null | undefined;

export type SongDetailQuery = { id: string };

export type SongDetailArgs = { query: SongDetailQuery } & BaseEndpointArgs;

// Album Artist List
export type RawAlbumArtistListResponse =
  | NDAlbumArtistList
  | SSAlbumArtistList
  | JFAlbumArtistList
  | undefined;

export type AlbumArtistListResponse = BasePaginatedResponse<AlbumArtist[]>;

export enum AlbumArtistListSort {
  ALBUM = 'album',
  ALBUM_COUNT = 'albumCount',
  DURATION = 'duration',
  FAVORITED = 'favorited',
  NAME = 'name',
  PLAY_COUNT = 'playCount',
  RANDOM = 'random',
  RATING = 'rating',
  RECENTLY_ADDED = 'recentlyAdded',
  RELEASE_DATE = 'releaseDate',
  SONG_COUNT = 'songCount',
}

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

type AlbumArtistListSortMap = {
  jellyfin: Record<AlbumArtistListSort, JFAlbumArtistListSort | undefined>;
  navidrome: Record<AlbumArtistListSort, NDAlbumArtistListSort | undefined>;
  subsonic: Record<AlbumArtistListSort, undefined>;
};

export const albumArtistListSortMap: AlbumArtistListSortMap = {
  jellyfin: {
    album: JFAlbumArtistListSort.ALBUM,
    albumCount: undefined,
    duration: JFAlbumArtistListSort.DURATION,
    favorited: undefined,
    name: JFAlbumArtistListSort.NAME,
    playCount: undefined,
    random: JFAlbumArtistListSort.RANDOM,
    rating: undefined,
    recentlyAdded: JFAlbumArtistListSort.RECENTLY_ADDED,
    releaseDate: undefined,
    songCount: undefined,
  },
  navidrome: {
    album: undefined,
    albumCount: NDAlbumArtistListSort.ALBUM_COUNT,
    duration: undefined,
    favorited: NDAlbumArtistListSort.FAVORITED,
    name: NDAlbumArtistListSort.NAME,
    playCount: NDAlbumArtistListSort.PLAY_COUNT,
    random: undefined,
    rating: NDAlbumArtistListSort.RATING,
    recentlyAdded: undefined,
    releaseDate: undefined,
    songCount: NDAlbumArtistListSort.SONG_COUNT,
  },
  subsonic: {
    album: undefined,
    albumCount: undefined,
    duration: undefined,
    favorited: undefined,
    name: undefined,
    playCount: undefined,
    random: undefined,
    rating: undefined,
    recentlyAdded: undefined,
    releaseDate: undefined,
    songCount: undefined,
  },
};

// Album Artist Detail
export type RawAlbumArtistDetailResponse =
  | NDAlbumArtistDetail
  | SSAlbumArtistDetail
  | JFAlbumArtistDetail
  | undefined;

export type AlbumArtistDetailResponse = BasePaginatedResponse<AlbumArtist[]>;

export type AlbumArtistDetailQuery = { id: string };

export type AlbumArtistDetailArgs = { query: AlbumArtistDetailQuery } & BaseEndpointArgs;

// Artist List
export type RawArtistListResponse = JFArtistList | undefined;

export type ArtistListResponse = BasePaginatedResponse<Artist[]>;

export enum ArtistListSort {
  ALBUM = 'album',
  ALBUM_COUNT = 'albumCount',
  DURATION = 'duration',
  FAVORITED = 'favorited',
  NAME = 'name',
  PLAY_COUNT = 'playCount',
  RANDOM = 'random',
  RATING = 'rating',
  RECENTLY_ADDED = 'recentlyAdded',
  RELEASE_DATE = 'releaseDate',
  SONG_COUNT = 'songCount',
}

export type ArtistListQuery = {
  limit?: number;
  musicFolderId?: string;
  ndParams?: {
    genre_id?: string;
    name?: string;
    starred?: boolean;
  };
  sortBy: ArtistListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type ArtistListArgs = { query: ArtistListQuery } & BaseEndpointArgs;

type ArtistListSortMap = {
  jellyfin: Record<ArtistListSort, JFArtistListSort | undefined>;
  navidrome: Record<ArtistListSort, undefined>;
  subsonic: Record<ArtistListSort, undefined>;
};

export const artistListSortMap: ArtistListSortMap = {
  jellyfin: {
    album: JFArtistListSort.ALBUM,
    albumCount: undefined,
    duration: JFArtistListSort.DURATION,
    favorited: undefined,
    name: JFArtistListSort.NAME,
    playCount: undefined,
    random: JFArtistListSort.RANDOM,
    rating: undefined,
    recentlyAdded: JFArtistListSort.RECENTLY_ADDED,
    releaseDate: undefined,
    songCount: undefined,
  },
  navidrome: {
    album: undefined,
    albumCount: undefined,
    duration: undefined,
    favorited: undefined,
    name: undefined,
    playCount: undefined,
    random: undefined,
    rating: undefined,
    recentlyAdded: undefined,
    releaseDate: undefined,
    songCount: undefined,
  },
  subsonic: {
    album: undefined,
    albumCount: undefined,
    duration: undefined,
    favorited: undefined,
    name: undefined,
    playCount: undefined,
    random: undefined,
    rating: undefined,
    recentlyAdded: undefined,
    releaseDate: undefined,
    songCount: undefined,
  },
};

// Artist Detail

// Favorite
export type RawFavoriteResponse = FavoriteResponse | undefined;

export type FavoriteResponse = { id: string };

export type FavoriteQuery = { id: string; type?: 'song' | 'album' | 'albumArtist' };

export type FavoriteArgs = { query: FavoriteQuery } & BaseEndpointArgs;

// Rating
export type RawRatingResponse = null | undefined;

export type RatingResponse = null;

export type RatingQuery = { id: string; rating: number };

export type RatingArgs = { query: RatingQuery } & BaseEndpointArgs;

// Create Playlist
export type RawCreatePlaylistResponse = CreatePlaylistResponse | undefined;

export type CreatePlaylistResponse = { id: string; name: string };

export type CreatePlaylistQuery = { comment?: string; name: string; public?: boolean };

export type CreatePlaylistArgs = { query: CreatePlaylistQuery } & BaseEndpointArgs;

// Delete Playlist
export type RawDeletePlaylistResponse = NDDeletePlaylist | undefined;

export type DeletePlaylistResponse = null;

export type DeletePlaylistQuery = { id: string };

export type DeletePlaylistArgs = { query: DeletePlaylistQuery } & BaseEndpointArgs;

// Playlist List
export type RawPlaylistListResponse = NDPlaylistList | JFPlaylistList | undefined;

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

type PlaylistListSortMap = {
  jellyfin: Record<PlaylistListSort, undefined>;
  navidrome: Record<PlaylistListSort, NDPlaylistListSort | undefined>;
  subsonic: Record<PlaylistListSort, undefined>;
};

export const playlistListSortMap: PlaylistListSortMap = {
  jellyfin: {
    duration: undefined,
    name: undefined,
    owner: undefined,
    public: undefined,
    songCount: undefined,
    updatedAt: undefined,
  },
  navidrome: {
    duration: NDPlaylistListSort.DURATION,
    name: NDPlaylistListSort.NAME,
    owner: NDPlaylistListSort.OWNER,
    public: NDPlaylistListSort.PUBLIC,
    songCount: NDPlaylistListSort.SONG_COUNT,
    updatedAt: NDPlaylistListSort.UPDATED_AT,
  },
  subsonic: {
    duration: undefined,
    name: undefined,
    owner: undefined,
    public: undefined,
    songCount: undefined,
    updatedAt: undefined,
  },
};

// Playlist Detail
export type RawPlaylistDetailResponse = NDPlaylistDetail | JFPlaylistDetail | undefined;

export type PlaylistDetailResponse = BasePaginatedResponse<Playlist[]>;

export type PlaylistDetailQuery = {
  id: string;
};

export type PlaylistDetailArgs = { query: PlaylistDetailQuery } & BaseEndpointArgs;

// Playlist Songs
export type RawPlaylistSongListResponse = JFSongList | undefined;

export type PlaylistSongListResponse = BasePaginatedResponse<Song[]>;

export type PlaylistSongListQuery = {
  id: string;
  limit?: number;
  sortBy?: SongListSort;
  sortOrder?: SortOrder;
  startIndex: number;
};

export type PlaylistSongListArgs = { query: PlaylistSongListQuery } & BaseEndpointArgs;

// Music Folder List
export type RawMusicFolderListResponse = SSMusicFolderList | JFMusicFolderList | undefined;

export type MusicFolderListResponse = BasePaginatedResponse<Playlist[]>;

export type MusicFolderListArgs = BaseEndpointArgs;

// Create Favorite
export type RawCreateFavoriteResponse = CreateFavoriteResponse | undefined;

export type CreateFavoriteResponse = { id: string };

export type CreateFavoriteQuery = { comment?: string; name: string; public?: boolean };

export type CreateFavoriteArgs = { query: CreateFavoriteQuery } & BaseEndpointArgs;
