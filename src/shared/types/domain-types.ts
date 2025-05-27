import orderBy from 'lodash/orderBy';
import reverse from 'lodash/reverse';
import shuffle from 'lodash/shuffle';
import { z } from 'zod';

import {
    JFAlbumArtistListSort,
    JFAlbumListSort,
    JFArtistListSort,
    JFGenreListSort,
    JFPlaylistListSort,
    JFSongListSort,
    JFSortOrder,
} from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import {
    NDAlbumArtistListSort,
    NDAlbumListSort,
    NDGenreListSort,
    NDOrder,
    NDPlaylistListSort,
    NDSongListSort,
    NDSortOrder,
    NDUserListSort,
} from '/@/shared/api/navidrome.types';
import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { ServerFeatures } from '/@/shared/types/features-types';
import { PlayerStatus } from '/@/shared/types/types';

export enum LibraryItem {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    GENRE = 'genre',
    PLAYLIST = 'playlist',
    SONG = 'song',
}

export enum ServerType {
    JELLYFIN = 'jellyfin',
    NAVIDROME = 'navidrome',
    SUBSONIC = 'subsonic',
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export type AnyLibraryItem = Album | AlbumArtist | Artist | Playlist | QueueSong | Song;

export type AnyLibraryItems =
    | Album[]
    | AlbumArtist[]
    | Artist[]
    | Playlist[]
    | QueueSong[]
    | Song[];

export interface PlayerData {
    current: {
        index: number;
        nextIndex?: number;
        player: 1 | 2;
        previousIndex?: number;
        shuffledIndex: number;
        song?: QueueSong;
        status: PlayerStatus;
    };
    player1?: QueueSong;
    player2?: QueueSong;
    queue: QueueData;
}

export interface QueueData {
    current?: QueueSong;
    length: number;
    next?: QueueSong;
    previous?: QueueSong;
}

export type QueueSong = Song & {
    uniqueId: string;
};

export type ServerListItem = {
    credential: string;
    features?: ServerFeatures;
    id: string;
    name: string;
    ndCredential?: string;
    savePassword?: boolean;
    type: ServerType;
    url: string;
    userId: null | string;
    username: string;
    version?: string;
};

export type User = {
    createdAt: null | string;
    email: null | string;
    id: string;
    isAdmin: boolean | null;
    lastLoginAt: null | string;
    name: string;
    updatedAt: null | string;
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

export enum GenreListSort {
    NAME = 'name',
}

export enum ImageType {
    BACKDROP = 'BACKDROP',
    LOGO = 'LOGO',
    PRIMARY = 'PRIMARY',
    SCREENSHOT = 'SCREENSHOT',
}

export type Album = {
    albumArtist: string;
    albumArtists: RelatedArtist[];
    artists: RelatedArtist[];
    backdropImageUrl: null | string;
    comment: null | string;
    createdAt: string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imagePlaceholderUrl: null | string;
    imageUrl: null | string;
    isCompilation: boolean | null;
    itemType: LibraryItem.ALBUM;
    lastPlayedAt: null | string;
    mbzId: null | string;
    name: string;
    originalDate: null | string;
    participants: null | Record<string, RelatedArtist[]>;
    playCount: null | number;
    releaseDate: null | string;
    releaseYear: null | number;
    serverId: string;
    serverType: ServerType;
    size: null | number;
    songCount: null | number;
    songs?: Song[];
    tags: null | Record<string, string[]>;
    uniqueId: string;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
} & { songs?: Song[] };

export type AlbumArtist = {
    albumCount: null | number;
    backgroundImageUrl: null | string;
    biography: null | string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem.ALBUM_ARTIST;
    lastPlayedAt: null | string;
    mbz: null | string;
    name: string;
    playCount: null | number;
    serverId: string;
    serverType: ServerType;
    similarArtists: null | RelatedArtist[];
    songCount: null | number;
    userFavorite: boolean;
    userRating: null | number;
};

export type Artist = {
    biography: null | string;
    createdAt: string;
    id: string;
    itemType: LibraryItem.ARTIST;
    name: string;
    remoteCreatedAt: null | string;
    serverFolderId: string;
    serverId: string;
    serverType: ServerType;
    updatedAt: string;
};

export type AuthenticationResponse = {
    credential: string;
    ndCredential?: string;
    userId: null | string;
    username: string;
};

export interface BasePaginatedResponse<T> {
    error?: any | string;
    items: T;
    startIndex: number;
    totalRecordCount: null | number;
}

export interface BaseQuery<T> {
    sortBy: T;
    sortOrder: SortOrder;
}

export type EndpointDetails = {
    server: ServerListItem;
};

export type GainInfo = {
    album?: number;
    track?: number;
};

export type Genre = {
    albumCount?: number;
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem.GENRE;
    name: string;
    songCount?: number;
};

export type GenreListArgs = BaseEndpointArgs & { query: GenreListQuery };

export interface GenreListQuery extends BaseQuery<GenreListSort> {
    _custom?: {
        jellyfin?: null;
        navidrome?: null;
    };
    limit?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}

// Genre List
export type GenreListResponse = BasePaginatedResponse<Genre[]> | null | undefined;

export type GenresResponse = Genre[];

export type ListSortOrder = JFSortOrder | NDOrder;

export type MusicFolder = {
    id: string;
    name: string;
};

export type MusicFoldersResponse = MusicFolder[];

export type Playlist = {
    description: null | string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imagePlaceholderUrl: null | string;
    imageUrl: null | string;
    itemType: LibraryItem.PLAYLIST;
    name: string;
    owner: null | string;
    ownerId: null | string;
    public: boolean | null;
    rules?: null | Record<string, any>;
    serverId: string;
    serverType: ServerType;
    size: null | number;
    songCount: null | number;
    sync?: boolean | null;
};

export type RelatedAlbumArtist = {
    id: string;
    name: string;
};

export type RelatedArtist = {
    id: string;
    imageUrl: null | string;
    name: string;
};

export type Song = {
    album: null | string;
    albumArtists: RelatedArtist[];
    albumId: string;
    artistName: string;
    artists: RelatedArtist[];
    bitRate: number;
    bpm: null | number;
    channels: null | number;
    comment: null | string;
    compilation: boolean | null;
    container: null | string;
    createdAt: string;
    discNumber: number;
    discSubtitle: null | string;
    duration: number;
    gain: GainInfo | null;
    genres: Genre[];
    id: string;
    imagePlaceholderUrl: null | string;
    imageUrl: null | string;
    itemType: LibraryItem.SONG;
    lastPlayedAt: null | string;
    lyrics: null | string;
    name: string;
    participants: null | Record<string, RelatedArtist[]>;
    path: null | string;
    peak: GainInfo | null;
    playCount: number;
    playlistItemId?: string;
    releaseDate: null | string;
    releaseYear: null | string;
    serverId: string;
    serverType: ServerType;
    size: number;
    streamUrl: string;
    tags: null | Record<string, string[]>;
    trackNumber: number;
    uniqueId: string;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
};

type BaseEndpointArgs = {
    apiClientProps: {
        server: null | ServerListItem;
        signal?: AbortSignal;
    };
};

type GenreListSortMap = {
    jellyfin: Record<GenreListSort, JFGenreListSort | undefined>;
    navidrome: Record<GenreListSort, NDGenreListSort | undefined>;
    subsonic: Record<UserListSort, undefined>;
};

export const genreListSortMap: GenreListSortMap = {
    jellyfin: {
        name: JFGenreListSort.NAME,
    },
    navidrome: {
        name: NDGenreListSort.NAME,
    },
    subsonic: {
        name: undefined,
    },
};

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

export type AlbumListArgs = BaseEndpointArgs & { query: AlbumListQuery };

export interface AlbumListQuery extends BaseQuery<AlbumListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumList>>;
    };
    artistIds?: string[];
    compilation?: boolean;
    favorite?: boolean;
    genres?: string[];
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}

// Album List
export type AlbumListResponse = BasePaginatedResponse<Album[]> | null | undefined;

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
        playCount: JFAlbumListSort.PLAY_COUNT,
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
        // Recent versions of Navidrome support release date, but fallback to year for now
        releaseDate: NDAlbumListSort.YEAR,
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

export type AlbumDetailArgs = BaseEndpointArgs & { query: AlbumDetailQuery };

export type AlbumDetailQuery = { id: string };

// Album Detail
export type AlbumDetailResponse = Album | null | undefined;

export type AlbumInfo = {
    imageUrl: null | string;
    notes: null | string;
};

export type SongListArgs = BaseEndpointArgs & { query: SongListQuery };

export interface SongListQuery extends BaseQuery<SongListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.songList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.songList>>;
    };
    albumArtistIds?: string[];
    albumIds?: string[];
    artistIds?: string[];
    favorite?: boolean;
    genreIds?: string[];
    imageSize?: number;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    role?: string;
    searchTerm?: string;
    startIndex: number;
}

// Song List
export type SongListResponse = BasePaginatedResponse<Song[]> | null | undefined;

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
        random: NDSongListSort.RANDOM,
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

export type AlbumArtistListArgs = BaseEndpointArgs & { query: AlbumArtistListQuery };

export interface AlbumArtistListQuery extends BaseQuery<AlbumArtistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumArtistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumArtistList>>;
    };
    limit?: number;
    musicFolderId?: string;
    searchTerm?: string;
    startIndex: number;
}

// Album Artist List
export type AlbumArtistListResponse = BasePaginatedResponse<AlbumArtist[]> | null | undefined;

export type SongDetailArgs = BaseEndpointArgs & { query: SongDetailQuery };

export type SongDetailQuery = { id: string };

// Song Detail
export type SongDetailResponse = null | Song | undefined;

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

export type AlbumArtistDetailArgs = BaseEndpointArgs & { query: AlbumArtistDetailQuery };

export type AlbumArtistDetailQuery = { id: string };

export type AlbumArtistDetailResponse = AlbumArtist | null;

export type ArtistListArgs = BaseEndpointArgs & { query: ArtistListQuery };

export interface ArtistListQuery extends BaseQuery<ArtistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.albumArtistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.albumArtistList>>;
    };
    limit?: number;
    musicFolderId?: string;
    role?: string;
    searchTerm?: string;
    startIndex: number;
}

// Artist List
export type ArtistListResponse = BasePaginatedResponse<AlbumArtist[]> | null | undefined;

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

export enum PlaylistListSort {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'owner',
    PUBLIC = 'public',
    SONG_COUNT = 'songCount',
    UPDATED_AT = 'updatedAt',
}

export type AddToPlaylistArgs = BaseEndpointArgs & {
    body: AddToPlaylistBody;
    query: AddToPlaylistQuery;
    serverId?: string;
};

export type AddToPlaylistBody = {
    songId: string[];
};

export type AddToPlaylistQuery = {
    id: string;
};

// Add to playlist
export type AddToPlaylistResponse = null | undefined;

export type CreatePlaylistArgs = BaseEndpointArgs & { body: CreatePlaylistBody; serverId?: string };

export type CreatePlaylistBody = {
    _custom?: {
        navidrome?: {
            owner?: string;
            ownerId?: string;
            rules?: Record<string, any>;
            sync?: boolean;
        };
    };
    comment?: string;
    name: string;
    public?: boolean;
};

// Create Playlist
export type CreatePlaylistResponse = undefined | { id: string };

export type DeletePlaylistArgs = BaseEndpointArgs & {
    query: DeletePlaylistQuery;
    serverId?: string;
};

export type DeletePlaylistQuery = { id: string };

// Delete Playlist
export type DeletePlaylistResponse = null | undefined;

export type FavoriteArgs = BaseEndpointArgs & { query: FavoriteQuery; serverId?: string };

export type FavoriteQuery = {
    id: string[];
    type: LibraryItem;
};

// Favorite
export type FavoriteResponse = null | undefined;

export type PlaylistListArgs = BaseEndpointArgs & { query: PlaylistListQuery };

export interface PlaylistListQuery extends BaseQuery<PlaylistListSort> {
    _custom?: {
        jellyfin?: Partial<z.infer<typeof jfType._parameters.playlistList>>;
        navidrome?: Partial<z.infer<typeof ndType._parameters.playlistList>>;
    };
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

// Playlist List
export type PlaylistListResponse = BasePaginatedResponse<Playlist[]> | null | undefined;

export type RatingQuery = {
    item: AnyLibraryItems;
    rating: number;
};

// Rating
export type RatingResponse = null | undefined;

export type RemoveFromPlaylistArgs = BaseEndpointArgs & {
    query: RemoveFromPlaylistQuery;
    serverId?: string;
};

export type RemoveFromPlaylistQuery = {
    id: string;
    songId: string[];
};

// Remove from playlist
export type RemoveFromPlaylistResponse = null | undefined;

export type SetRatingArgs = BaseEndpointArgs & { query: RatingQuery; serverId?: string };

export type ShareItemArgs = BaseEndpointArgs & { body: ShareItemBody; serverId?: string };

export type ShareItemBody = {
    description: string;
    downloadable: boolean;
    expires: number;
    resourceIds: string;
    resourceType: string;
};

// Sharing
export type ShareItemResponse = undefined | { id: string };

export type UpdatePlaylistArgs = BaseEndpointArgs & {
    body: UpdatePlaylistBody;
    query: UpdatePlaylistQuery;
    serverId?: string;
};

export type UpdatePlaylistBody = {
    _custom?: {
        navidrome?: {
            owner?: string;
            ownerId?: string;
            rules?: Record<string, any>;
            sync?: boolean;
        };
    };
    comment?: string;
    genres?: Genre[];
    name: string;
    public?: boolean;
};

export type UpdatePlaylistQuery = {
    id: string;
};

// Update Playlist
export type UpdatePlaylistResponse = null | undefined;

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

export enum UserListSort {
    NAME = 'name',
}

export type MusicFolderListArgs = BaseEndpointArgs;

export type MusicFolderListQuery = null;

// Music Folder List
export type MusicFolderListResponse = BasePaginatedResponse<MusicFolder[]> | null | undefined;

export type PlaylistDetailArgs = BaseEndpointArgs & { query: PlaylistDetailQuery };

export type PlaylistDetailQuery = {
    id: string;
};

// Playlist Detail
export type PlaylistDetailResponse = Playlist;

export type PlaylistSongListArgs = BaseEndpointArgs & { query: PlaylistSongListQuery };

export type PlaylistSongListQuery = {
    id: string;
    limit?: number;
    sortBy?: SongListSort;
    sortOrder?: SortOrder;
    startIndex: number;
};

// Playlist Songs
export type PlaylistSongListResponse = BasePaginatedResponse<Song[]> | null | undefined;

export type UserListArgs = BaseEndpointArgs & { query: UserListQuery };

export interface UserListQuery extends BaseQuery<UserListSort> {
    _custom?: {
        navidrome?: {
            owner_id?: string;
        };
    };
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

// User list
// Playlist List
export type UserListResponse = BasePaginatedResponse<User[]> | null | undefined;

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

export enum Played {
    All = 'all',
    Never = 'never',
    Played = 'played',
}

export type ArtistInfoArgs = BaseEndpointArgs & { query: ArtistInfoQuery };

// Artist Info
export type ArtistInfoQuery = {
    artistId: string;
    limit: number;
    musicFolderId?: string;
};

export type FullLyricsMetadata = Omit<InternetProviderLyricResponse, 'id' | 'lyrics' | 'source'> & {
    lyrics: LyricsResponse;
    remote: boolean;
    source: string;
};

export type InternetProviderLyricResponse = {
    artist: string;
    id: string;
    lyrics: string;
    name: string;
    source: LyricSource;
};

export type InternetProviderLyricSearchResponse = {
    artist: string;
    id: string;
    name: string;
    score?: number;
    source: LyricSource;
};

export type LyricOverride = Omit<InternetProviderLyricResponse, 'lyrics'>;

export type LyricsArgs = BaseEndpointArgs & {
    query: LyricsQuery;
};

export type LyricsQuery = {
    songId: string;
};

export type LyricsResponse = string | SynchronizedLyricsArray;

export type RandomSongListArgs = BaseEndpointArgs & {
    query: RandomSongListQuery;
};

export type RandomSongListQuery = {
    genre?: string;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string;
    played: Played;
};

export type RandomSongListResponse = SongListResponse;

export type ScrobbleArgs = BaseEndpointArgs & {
    query: ScrobbleQuery;
    serverId?: string;
};

export type ScrobbleQuery = {
    event?: 'pause' | 'start' | 'timeupdate' | 'unpause';
    id: string;
    position?: number;
    submission: boolean;
};

// Scrobble
export type ScrobbleResponse = null | undefined;

export type SearchAlbumArtistsQuery = {
    albumArtistLimit?: number;
    albumArtistStartIndex?: number;
    musicFolderId?: string;
    query?: string;
};

export type SearchAlbumsQuery = {
    albumLimit?: number;
    albumStartIndex?: number;
    musicFolderId?: string;
    query?: string;
};

export type SearchArgs = BaseEndpointArgs & {
    query: SearchQuery;
};

export type SearchQuery = {
    albumArtistLimit?: number;
    albumArtistStartIndex?: number;
    albumLimit?: number;
    albumStartIndex?: number;
    musicFolderId?: string;
    query?: string;
    songLimit?: number;
    songStartIndex?: number;
};

export type SearchResponse = {
    albumArtists: AlbumArtist[];
    albums: Album[];
    songs: Song[];
};

export type SearchSongsQuery = {
    musicFolderId?: string;
    query?: string;
    songLimit?: number;
    songStartIndex?: number;
};

export type SynchronizedLyricsArray = Array<[number, string]>;

export type TopSongListArgs = BaseEndpointArgs & { query: TopSongListQuery };

export type TopSongListQuery = {
    artist: string;
    artistId: string;
    limit?: number;
};

// Top Songs List
export type TopSongListResponse = BasePaginatedResponse<Song[]> | null | undefined;

export const instanceOfCancellationError = (error: any) => {
    return 'revert' in error;
};

export enum LyricSource {
    GENIUS = 'Genius',
    LRCLIB = 'lrclib.net',
    NETEASE = 'NetEase',
}

export type ControllerEndpoint = {
    addToPlaylist: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    createFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    createPlaylist: (args: CreatePlaylistArgs) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    deletePlaylist: (args: DeletePlaylistArgs) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (args: AlbumArtistDetailArgs) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (args: AlbumArtistListArgs) => Promise<AlbumArtistListResponse>;
    getAlbumArtistListCount: (args: AlbumArtistListArgs) => Promise<number>;
    getAlbumDetail: (args: AlbumDetailArgs) => Promise<AlbumDetailResponse>;
    getAlbumInfo?: (args: AlbumDetailArgs) => Promise<AlbumInfo>;
    getAlbumList: (args: AlbumListArgs) => Promise<AlbumListResponse>;
    getAlbumListCount: (args: AlbumListArgs) => Promise<number>;
    // getArtistInfo?: (args: any) => void;
    getArtistList: (args: ArtistListArgs) => Promise<ArtistListResponse>;
    getArtistListCount: (args: ArtistListArgs) => Promise<number>;
    getDownloadUrl: (args: DownloadArgs) => string;
    getGenreList: (args: GenreListArgs) => Promise<GenreListResponse>;
    getLyrics?: (args: LyricsArgs) => Promise<LyricsResponse>;
    getMusicFolderList: (args: MusicFolderListArgs) => Promise<MusicFolderListResponse>;
    getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (args: PlaylistListArgs) => Promise<PlaylistListResponse>;
    getPlaylistListCount: (args: PlaylistListArgs) => Promise<number>;
    getPlaylistSongList: (args: PlaylistSongListArgs) => Promise<SongListResponse>;
    getRandomSongList: (args: RandomSongListArgs) => Promise<SongListResponse>;
    getRoles: (args: BaseEndpointArgs) => Promise<Array<string | { label: string; value: string }>>;
    getServerInfo: (args: ServerInfoArgs) => Promise<ServerInfo>;
    getSimilarSongs: (args: SimilarSongsArgs) => Promise<Song[]>;
    getSongDetail: (args: SongDetailArgs) => Promise<SongDetailResponse>;
    getSongList: (args: SongListArgs) => Promise<SongListResponse>;
    getSongListCount: (args: SongListArgs) => Promise<number>;
    getStructuredLyrics?: (args: StructuredLyricsArgs) => Promise<StructuredLyric[]>;
    getTags?: (args: TagArgs) => Promise<TagResponses>;
    getTopSongs: (args: TopSongListArgs) => Promise<TopSongListResponse>;
    getTranscodingUrl: (args: TranscodingArgs) => string;
    getUserList?: (args: UserListArgs) => Promise<UserListResponse>;
    movePlaylistItem?: (args: MoveItemArgs) => Promise<void>;
    removeFromPlaylist: (args: RemoveFromPlaylistArgs) => Promise<RemoveFromPlaylistResponse>;
    scrobble: (args: ScrobbleArgs) => Promise<ScrobbleResponse>;
    search: (args: SearchArgs) => Promise<SearchResponse>;
    setRating?: (args: SetRatingArgs) => Promise<RatingResponse>;
    shareItem?: (args: ShareItemArgs) => Promise<ShareItemResponse>;
    updatePlaylist: (args: UpdatePlaylistArgs) => Promise<UpdatePlaylistResponse>;
};

export type DownloadArgs = BaseEndpointArgs & {
    query: DownloadQuery;
};

export type DownloadQuery = {
    id: string;
};

// This type from https://wicg.github.io/local-font-access/#fontdata
// NOTE: it is still experimental, so this should be updates as appropriate
export type FontData = {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
};

export type LyricGetQuery = {
    remoteSongId: string;
    remoteSource: LyricSource;
    song: Song;
};

export type LyricSearchQuery = {
    album?: string;
    artist?: string;
    duration?: number;
    name?: string;
};

export type LyricsOverride = Omit<FullLyricsMetadata, 'lyrics'> & { id: string };

export type MoveItemArgs = BaseEndpointArgs & {
    query: MoveItemQuery;
};

export type MoveItemQuery = {
    endingIndex: number;
    playlistId: string;
    startingIndex: number;
    trackId: string;
};

export type ServerInfo = {
    features: ServerFeatures;
    id?: string;
    version: string;
};

export type ServerInfoArgs = BaseEndpointArgs;

export type SimilarSongsArgs = BaseEndpointArgs & {
    query: SimilarSongsQuery;
};

export type SimilarSongsQuery = {
    albumArtistIds: string[];
    count?: number;
    songId: string;
};

export type StructuredLyric = (StructuredSyncedLyric | StructuredUnsyncedLyric) & {
    lang: string;
};

export type StructuredLyricsArgs = BaseEndpointArgs & {
    query: LyricsQuery;
};

export type StructuredSyncedLyric = Omit<FullLyricsMetadata, 'lyrics'> & {
    lyrics: SynchronizedLyricsArray;
    synced: true;
};

export type StructuredUnsyncedLyric = Omit<FullLyricsMetadata, 'lyrics'> & {
    lyrics: string;
    synced: false;
};

export type Tag = {
    name: string;
    options: string[];
};

export type TagArgs = BaseEndpointArgs & {
    query: TagQuery;
};

export type TagQuery = {
    folder?: string;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
};

export type TagResponses = {
    boolTags?: string[];
    enumTags?: Tag[];
};

export type TranscodingArgs = BaseEndpointArgs & {
    query: TranscodingQuery;
};

export type TranscodingQuery = {
    base: string;
    bitrate?: number;
    format?: string;
};

export const sortAlbumList = (albums: Album[], sortBy: AlbumListSort, sortOrder: SortOrder) => {
    let results = albums;

    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case AlbumListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                ['albumArtist', (v) => v.name.toLowerCase()],
                [order, 'asc'],
            );
            break;
        case AlbumListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;
        case AlbumListSort.FAVORITED:
            results = orderBy(results, ['starred'], [order]);
            break;
        case AlbumListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;
        case AlbumListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;
        case AlbumListSort.RANDOM:
            results = shuffle(results);
            break;
        case AlbumListSort.RATING:
            results = orderBy(results, ['userRating'], [order]);
            break;
        case AlbumListSort.RECENTLY_ADDED:
            results = orderBy(results, ['createdAt'], [order]);
            break;
        case AlbumListSort.RECENTLY_PLAYED:
            results = orderBy(results, ['lastPlayedAt'], [order]);
            break;
        case AlbumListSort.SONG_COUNT:
            results = orderBy(results, ['songCount'], [order]);
            break;
        case AlbumListSort.YEAR:
            results = orderBy(results, ['releaseYear'], [order]);
            break;
        default:
            break;
    }

    return results;
};

export const sortSongList = (songs: QueueSong[], sortBy: SongListSort, sortOrder: SortOrder) => {
    let results = songs;

    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
        case SongListSort.ALBUM:
            results = orderBy(
                results,
                [(v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ALBUM_ARTIST:
            results = orderBy(
                results,
                ['albumArtist', (v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ARTIST:
            results = orderBy(
                results,
                ['artist', (v) => v.album?.toLowerCase(), 'discNumber', 'trackNumber'],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.DURATION:
            results = orderBy(results, ['duration'], [order]);
            break;

        case SongListSort.FAVORITED:
            results = orderBy(results, ['userFavorite', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.GENRE:
            results = orderBy(
                results,
                [
                    (v) => v.genres?.[0].name.toLowerCase(),
                    (v) => v.album?.toLowerCase(),
                    'discNumber',
                    'trackNumber',
                ],
                [order, order, 'asc', 'asc'],
            );
            break;

        case SongListSort.ID:
            if (order === 'desc') {
                results = reverse(results as any);
            }
            break;

        case SongListSort.NAME:
            results = orderBy(results, [(v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.PLAY_COUNT:
            results = orderBy(results, ['playCount'], [order]);
            break;

        case SongListSort.RANDOM:
            results = shuffle(results);
            break;

        case SongListSort.RATING:
            results = orderBy(results, ['userRating', (v) => v.name.toLowerCase()], [order]);
            break;

        case SongListSort.RECENTLY_ADDED:
            results = orderBy(results, ['created'], [order]);
            break;

        case SongListSort.YEAR:
            results = orderBy(
                results,
                ['year', (v) => v.album?.toLowerCase(), 'discNumber', 'track'],
                [order, 'asc', 'asc', 'asc'],
            );
            break;

        default:
            break;
    }

    return results;
};

export const sortAlbumArtistList = (
    artists: AlbumArtist[],
    sortBy: AlbumArtistListSort | ArtistListSort,
    sortOrder: SortOrder,
) => {
    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    let results = artists;

    switch (sortBy) {
        case AlbumArtistListSort.ALBUM_COUNT:
            results = orderBy(artists, ['albumCount', (v) => v.name.toLowerCase()], [order, 'asc']);
            break;

        case AlbumArtistListSort.FAVORITED:
            results = orderBy(artists, ['starred'], [order]);
            break;

        case AlbumArtistListSort.NAME:
            results = orderBy(artists, [(v) => v.name.toLowerCase()], [order]);
            break;

        case AlbumArtistListSort.RATING:
            results = orderBy(artists, ['userRating'], [order]);
            break;

        default:
            break;
    }

    return results;
};
