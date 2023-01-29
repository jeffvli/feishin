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
  JFPlaylistListSort,
} from '/@/renderer/api/jellyfin.types';
import {
  NDSortOrder,
  NDOrder,
  NDGenreList,
  NDAlbumList,
  NDAlbumListSort,
  NDAlbumDetail,
  NDSongList,
  NDSongDetail,
  NDAlbumArtistList,
  NDAlbumArtistListSort,
  NDAlbumArtistDetail,
  NDDeletePlaylist,
  NDPlaylistList,
  NDPlaylistListSort,
  NDPlaylistDetail,
  NDSongListSort,
  NDUserList,
  NDUserListSort,
} from '/@/renderer/api/navidrome.types';
import {
  SSAlbumList,
  SSAlbumDetail,
  SSAlbumArtistList,
  SSAlbumArtistDetail,
  SSMusicFolderList,
  SSGenreList,
  SSTopSongList,
} from '/@/renderer/api/subsonic.types';

export enum LibraryItem {
  ALBUM = 'album',
  ALBUM_ARTIST = 'albumArtist',
  ARTIST = 'artist',
  PLAYLIST = 'playlist',
  SONG = 'song',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type User = {
  createdAt: string | null;
  email: string | null;
  id: string;
  isAdmin: boolean | null;
  lastLoginAt: string | null;
  name: string;
  updatedAt: string | null;
};

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
  itemType: LibraryItem.ALBUM;
  lastPlayedAt: string | null;
  name: string;
  playCount: number | null;
  releaseDate: string | null;
  releaseYear: number | null;
  serverId: string;
  serverType: ServerType;
  size: number | null;
  songCount: number | null;
  songs?: Song[];
  uniqueId: string;
  updatedAt: string;
  userFavorite: boolean;
  userRating: number | null;
} & { songs?: Song[] };

export type Song = {
  album: string;
  albumArtists: RelatedArtist[];
  albumId: string;
  artistName: string;
  artists: RelatedArtist[];
  bitRate: number;
  bpm: number | null;
  channels: number | null;
  comment: string | null;
  compilation: boolean | null;
  container: string | null;
  createdAt: string;
  discNumber: number;
  duration: number;
  genres: Genre[];
  id: string;
  imagePlaceholderUrl: string | null;
  imageUrl: string | null;
  itemType: LibraryItem.SONG;
  lastPlayedAt: string | null;
  name: string;
  path: string | null;
  playCount: number;
  releaseDate: string | null;
  releaseYear: string | null;
  serverId: string;
  serverType: ServerType;
  size: number;
  streamUrl: string;
  trackNumber: number;
  uniqueId: string;
  updatedAt: string;
  userFavorite: boolean;
  userRating: number | null;
};

export type AlbumArtist = {
  albumCount: number | null;
  backgroundImageUrl: string | null;
  biography: string | null;
  duration: number | null;
  genres: Genre[];
  id: string;
  imageUrl: string | null;
  itemType: LibraryItem.ALBUM_ARTIST;
  lastPlayedAt: string | null;
  name: string;
  playCount: number | null;
  serverId: string;
  serverType: ServerType;
  similarArtists: RelatedArtist[] | null;
  songCount: number | null;
  userFavorite: boolean;
  userRating: number | null;
};

export type RelatedAlbumArtist = {
  id: string;
  name: string;
};

export type Artist = {
  biography: string | null;
  createdAt: string;
  id: string;
  itemType: LibraryItem.ARTIST;
  name: string;
  remoteCreatedAt: string | null;
  serverFolderId: string;
  serverId: string;
  serverType: ServerType;
  updatedAt: string;
};

export type RelatedArtist = {
  id: string;
  imageUrl: string | null;
  name: string;
};

export type MusicFolder = {
  id: string;
  name: string;
};

export type Playlist = {
  description: string | null;
  duration: number | null;
  genres: Genre[];
  id: string;
  imagePlaceholderUrl: string | null;
  imageUrl: string | null;
  itemType: LibraryItem.PLAYLIST;
  name: string;
  owner: string | null;
  ownerId: string | null;
  public: boolean | null;
  rules?: Record<string, any> | null;
  serverId: string;
  serverType: ServerType;
  size: number | null;
  songCount: number | null;
  sync?: boolean | null;
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
    contributingArtistIds?: string;
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
  ID = 'id',
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
  albumIds?: string[];
  artistIds?: string[];
  jfParams?: {
    artistIds?: string;
    contributingArtistIds?: string;
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
    album_id?: string[];
    artist_id?: string[];
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
    id: undefined,
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
    album: NDSongListSort.ALBUM_SONGS,
    albumArtist: NDSongListSort.ALBUM_ARTIST,
    artist: NDSongListSort.ARTIST,
    bpm: NDSongListSort.BPM,
    channels: NDSongListSort.CHANNELS,
    comment: NDSongListSort.COMMENT,
    duration: NDSongListSort.DURATION,
    favorited: NDSongListSort.FAVORITED,
    genre: NDSongListSort.GENRE,
    id: NDSongListSort.ID,
    name: NDSongListSort.TITLE,
    playCount: NDSongListSort.PLAY_COUNT,
    random: undefined,
    rating: NDSongListSort.RATING,
    recentlyAdded: NDSongListSort.RECENTLY_ADDED,
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
    id: undefined,
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
  searchTerm?: string;
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

export type FavoriteResponse = { id: string[]; type: LibraryItem };

export type FavoriteQuery = {
  id: string[];
  type: LibraryItem;
};

export type FavoriteArgs = { query: FavoriteQuery } & BaseEndpointArgs;

// Rating
export type RawRatingResponse = RatingResponse | undefined;

export type RatingResponse = { id: string[]; rating: number };

export type RatingQuery = { id: string[]; rating: number };

export type RatingArgs = { query: RatingQuery } & BaseEndpointArgs;

// Add to playlist
export type RawAddToPlaylistResponse = null | undefined;

export type AddToPlaylistQuery = {
  id: string;
};

export type AddToPlaylistBody = {
  songId: string[];
};

export type AddToPlaylistArgs = {
  body: AddToPlaylistBody;
  query: AddToPlaylistQuery;
} & BaseEndpointArgs;

// Remove from playlist
export type RawRemoveFromPlaylistResponse = null | undefined;

export type RemoveFromPlaylistQuery = {
  id: string;
  songId: string[];
};

export type RemoveFromPlaylistArgs = { query: RemoveFromPlaylistQuery } & BaseEndpointArgs;

// Create Playlist
export type RawCreatePlaylistResponse = CreatePlaylistResponse | undefined;

export type CreatePlaylistResponse = { id: string; name: string };

export type CreatePlaylistBody = {
  comment?: string;
  name: string;
  ndParams?: {
    owner?: string;
    ownerId?: string;
    public?: boolean;
    rules?: Record<string, any>;
    sync?: boolean;
  };
};

export type CreatePlaylistArgs = { body: CreatePlaylistBody } & BaseEndpointArgs;

// Update Playlist
export type RawUpdatePlaylistResponse = UpdatePlaylistResponse | undefined;

export type UpdatePlaylistResponse = { id: string };

export type UpdatePlaylistQuery = {
  id: string;
};

export type UpdatePlaylistBody = {
  comment?: string;
  genres?: Genre[];
  name: string;
  ndParams?: {
    owner?: string;
    ownerId?: string;
    public?: boolean;
    rules?: Record<string, any>;
    sync?: boolean;
  };
};

export type UpdatePlaylistArgs = {
  body: UpdatePlaylistBody;
  query: UpdatePlaylistQuery;
} & BaseEndpointArgs;

// Delete Playlist
export type RawDeletePlaylistResponse = NDDeletePlaylist | undefined;

export type DeletePlaylistResponse = null;

export type DeletePlaylistQuery = { id: string };

export type DeletePlaylistArgs = { query: DeletePlaylistQuery } & BaseEndpointArgs;

// Playlist List
export type RawPlaylistListResponse = NDPlaylistList | JFPlaylistList | undefined;

export type PlaylistListResponse = BasePaginatedResponse<Playlist[]>;

export enum PlaylistListSort {
  DURATION = 'duration',
  NAME = 'name',
  OWNER = 'owner',
  PUBLIC = 'public',
  SONG_COUNT = 'songCount',
  UPDATED_AT = 'updatedAt',
}

export type PlaylistListQuery = {
  limit?: number;
  ndParams?: {
    owner_id?: string;
  };
  searchTerm?: string;
  sortBy: PlaylistListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type PlaylistListArgs = { query: PlaylistListQuery } & BaseEndpointArgs;

type PlaylistListSortMap = {
  jellyfin: Record<PlaylistListSort, JFPlaylistListSort | undefined>;
  navidrome: Record<PlaylistListSort, NDPlaylistListSort | undefined>;
  subsonic: Record<PlaylistListSort, undefined>;
};

export const playlistListSortMap: PlaylistListSortMap = {
  jellyfin: {
    duration: JFPlaylistListSort.DURATION,
    name: JFPlaylistListSort.NAME,
    owner: undefined,
    public: undefined,
    songCount: JFPlaylistListSort.SONG_COUNT,
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

// User list
// Playlist List
export type RawUserListResponse = NDUserList | undefined;

export type UserListResponse = BasePaginatedResponse<User[]>;

export enum UserListSort {
  NAME = 'name',
}

export type UserListQuery = {
  limit?: number;
  ndParams?: {
    owner_id?: string;
  };
  searchTerm?: string;
  sortBy: UserListSort;
  sortOrder: SortOrder;
  startIndex: number;
};

export type UserListArgs = { query: UserListQuery } & BaseEndpointArgs;

type UserListSortMap = {
  jellyfin: Record<UserListSort, undefined>;
  navidrome: Record<UserListSort, NDUserListSort | undefined>;
  subsonic: Record<UserListSort, undefined>;
};

export const userListSortMap: UserListSortMap = {
  jellyfin: {
    name: undefined,
  },
  navidrome: {
    name: NDUserListSort.NAME,
  },
  subsonic: {
    name: undefined,
  },
};

// Top Songs List
export type RawTopSongListResponse = SSTopSongList | undefined;

export type TopSongListResponse = BasePaginatedResponse<Song[]>;

export type TopSongListQuery = {
  artist: string;
  limit?: number;
};

export type TopSongListArgs = { query: TopSongListQuery } & BaseEndpointArgs;

// Artist Info
export type ArtistInfoQuery = {
  artistId: string;
  limit: number;
  musicFolderId?: string;
};

export type ArtistInfoArgs = { query: ArtistInfoQuery } & BaseEndpointArgs;
