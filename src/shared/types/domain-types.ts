import {
    JFAlbumArtistListSort,
    JFAlbumListSort,
    JFArtistListSort,
    JFGenreListSort,
    JFPlaylistListSort,
    JFSongListSort,
    JFSortOrder,
} from '/@/shared/api/jellyfin/jellyfin-types';
import {
    NDAlbumArtistListSort,
    NDAlbumListSort,
    NDGenreListSort,
    NDPlaylistListSort,
    NDSongListSort,
    NDSortOrder,
    NDTagListSort,
    NDUserListSort,
} from '/@/shared/api/navidrome/navidrome-types';
import { ServerFeatures } from '/@/shared/types/features-types';
import { PlayerRepeat, PlayerShuffle, PlayerStatus, PlayerStyle } from '/@/shared/types/types';

export enum LibraryItem {
    ALBUM = 'album',
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    FOLDER = 'folder',
    GENRE = 'genre',
    PLAYLIST = 'playlist',
    PLAYLIST_SONG = 'playlistSong',
    QUEUE_SONG = 'queueSong',
    RADIO_STATION = 'radioStation',
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
    currentSong: QueueSong | undefined;
    index: number;
    muted: boolean;
    nextSong: QueueSong | undefined;
    num: 1 | 2;
    player1: QueueSong | undefined;
    player2: QueueSong | undefined;
    previousSong: QueueSong | undefined;
    queue: QueueData;
    queueLength: number;
    repeat: PlayerRepeat;
    shuffle: PlayerShuffle;
    speed: number;
    status: PlayerStatus;
    transitionType: PlayerStyle;
    volume: number;
}

export interface QueueData {
    default: string[];
    priority: string[];
    shuffled: number[];
    songs: Record<string, QueueSong>;
}

export type QueueSong = Song & {
    _uniqueId: string;
};

export type ServerListItem = {
    features?: ServerFeatures;
    id: string;
    isAdmin?: boolean;
    musicFolderId?: string[];
    name: string;
    preferInstantMix?: boolean;
    savePassword?: boolean;
    type: ServerType;
    url: string;
    userId: null | string;
    username: string;
    version?: string;
};

export type ServerListItemWithCredential = ServerListItem & {
    credential: string;
    ndCredential?: string;
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

export enum ExplicitStatus {
    CLEAN = 'CLEAN',
    EXPLICIT = 'EXPLICIT',
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

export enum GenreListSort {
    NAME = 'name',
}

export enum ImageType {
    BACKDROP = 'BACKDROP',
    LOGO = 'LOGO',
    PRIMARY = 'PRIMARY',
    SCREENSHOT = 'SCREENSHOT',
}

export enum TagListSort {
    TAG_VALUE = 'tagValue',
}

export type Album = {
    _itemType: LibraryItem.ALBUM;
    _serverId: string;
    _serverType: ServerType;
    albumArtist: string;
    albumArtists: RelatedArtist[];
    artists: RelatedArtist[];
    comment: null | string;
    createdAt: string;
    duration: null | number;
    explicitStatus: ExplicitStatus | null;
    genres: Genre[];
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    isCompilation: boolean | null;
    lastPlayedAt: null | string;
    mbzId: null | string;
    name: string;
    originalDate: null | string;
    participants: null | Record<string, RelatedArtist[]>;
    playCount: null | number;
    recordLabels: string[];
    releaseDate: null | string;
    releaseTypes: string[];
    releaseYear: null | number;
    size: null | number;
    songCount: null | number;
    songs?: Song[];
    tags: null | Record<string, string[]>;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
    version: null | string;
} & { songs?: Song[] };

export type AlbumArtist = {
    _itemType: LibraryItem.ALBUM_ARTIST;
    _serverId: string;
    _serverType: ServerType;
    albumCount: null | number;
    biography: null | string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    lastPlayedAt: null | string;
    mbz: null | string;
    name: string;
    playCount: null | number;
    similarArtists: null | RelatedArtist[];
    songCount: null | number;
    userFavorite: boolean;
    userRating: null | number;
};

export type Artist = {
    _itemType: LibraryItem.ARTIST;
    _serverId: string;
    _serverType: ServerType;
    biography: null | string;
    createdAt: string;
    id: string;
    name: string;
    updatedAt: string;
};

export type AuthenticationResponse = {
    credential: string;
    isAdmin?: boolean;
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

export type Folder = {
    _itemType: LibraryItem.FOLDER;
    _serverId: string;
    _serverType: ServerType;
    children?: {
        folders: Folder[];
        songs: Song[];
    };
    id: string;
    name: string;
    parentId?: string;
};

export type FolderArgs = BaseEndpointArgs & { query: FolderQuery };

export interface FolderQuery extends BaseQuery<SongListSort> {
    id: string;
    musicFolderId?: string | string[];
    searchTerm?: string;
}

export type FolderResponse = Folder;

export type GainInfo = {
    album?: number;
    track?: number;
};

export type Genre = {
    _itemType: LibraryItem.GENRE;
    _serverId: string;
    _serverType: ServerType;
    albumCount: null | number;
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    name: string;
    songCount: null | number;
};

export type GenreListArgs = BaseEndpointArgs & { query: GenreListQuery };

export interface GenreListQuery extends BaseQuery<GenreListSort> {
    _custom?: {
        jellyfin?: null;
        navidrome?: null;
    };
    limit?: number;
    musicFolderId?: string | string[];
    searchTerm?: string;
    startIndex: number;
}

// Genre List
export type GenreListResponse = BasePaginatedResponse<Genre[]>;

export type GenresResponse = Genre[];

export type ListSortOrder = 'asc' | 'desc';

export type MusicFolder = {
    id: string;
    name: string;
};

export type MusicFoldersResponse = MusicFolder[];

export type Playlist = {
    _itemType: LibraryItem.PLAYLIST;
    _serverId: string;
    _serverType: ServerType;
    description: null | string;
    duration: null | number;
    genres: Genre[];
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    name: string;
    owner: null | string;
    ownerId: null | string;
    public: boolean | null;
    rules?: null | Record<string, any>;
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
    imageId: null | string;
    imageUrl: null | string;
    name: string;
};

export type Song = {
    _itemType: LibraryItem.SONG;
    _serverId: string;
    _serverType: ServerType;
    album: null | string;
    albumArtists: RelatedArtist[];
    albumId: string;
    artistName: string;
    artists: RelatedArtist[];
    bitDepth: null | number;
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
    explicitStatus: ExplicitStatus | null;
    gain: GainInfo | null;
    genres: Genre[];
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    lastPlayedAt: null | string;
    lyrics: null | string;
    mbzRecordingId: null | string;
    mbzTrackId: null | string;
    name: string;
    participants: null | Record<string, RelatedArtist[]>;
    path: null | string;
    peak: GainInfo | null;
    playCount: number;
    playlistItemId?: string;
    releaseDate: null | string;
    releaseYear: null | number;
    sampleRate: null | number;
    size: number;
    tags: null | Record<string, string[]>;
    trackNumber: number;
    updatedAt: string;
    userFavorite: boolean;
    userRating: null | number;
};

type BaseEndpointArgs = {
    apiClientProps: {
        server?: null | ServerListItemWithCredential;
        serverId: string;
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

type TagListSortMap = {
    jellyfin: Record<TagListSort, undefined>;
    navidrome: Record<TagListSort, NDTagListSort | undefined>;
    subsonic: Record<TagListSort, undefined>;
};

export const tagListSortMap: TagListSortMap = {
    jellyfin: {
        tagValue: undefined,
    },
    navidrome: {
        tagValue: NDTagListSort.TAG_VALUE,
    },
    subsonic: {
        tagValue: undefined,
    },
};

export enum AlbumListSort {
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    COMMUNITY_RATING = 'communityRating',
    CRITIC_RATING = 'criticRating',
    DURATION = 'duration',
    EXPLICIT_STATUS = 'explicitStatus',
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

export type AlbumListCountArgs = BaseEndpointArgs & { query: ListCountQuery<AlbumListQuery> };

export interface AlbumListQuery extends AlbumListNavidromeQuery, BaseQuery<AlbumListSort> {
    _custom?: Record<string, any>;
    artistIds?: string[];
    compilation?: boolean;
    favorite?: boolean;
    genreIds?: string[];
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string | string[];
    searchTerm?: string;
    startIndex: number;
}

// Album List
export type AlbumListResponse = BasePaginatedResponse<Album[]>;

export type ListCountQuery<TQuery> = Omit<TQuery, 'limit' | 'startIndex'>;

interface AlbumListNavidromeQuery {
    hasRating?: boolean;
    isRecentlyPlayed?: boolean;
}

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
        explicitStatus: undefined,
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
        explicitStatus: NDAlbumListSort.EXPLICIT_STATUS,
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
        explicitStatus: undefined,
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
    EXPLICIT_STATUS = 'explicitStatus',
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
export type AlbumDetailResponse = Album;

export type AlbumInfo = {
    imageUrl: null | string;
    notes: null | string;
};

export type SongListArgs = BaseEndpointArgs & { query: SongListQuery };

export type SongListCountArgs = BaseEndpointArgs & { query: ListCountQuery<SongListQuery> };

export interface SongListQuery extends BaseQuery<SongListSort> {
    _custom?: Record<string, any>;
    albumArtistIds?: string[];
    albumIds?: string[];
    artistIds?: string[];
    favorite?: boolean;
    genreIds?: string[];
    imageSize?: number;
    limit?: number;
    maxYear?: number;
    minYear?: number;
    musicFolderId?: string | string[];
    searchTerm?: string;
    startIndex: number;
}

// Song List
export type SongListResponse = BasePaginatedResponse<Song[]>;

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
        explicitStatus: undefined,
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
        explicitStatus: NDSongListSort.EXPLICIT_STATUS,
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
        explicitStatus: undefined,
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

export type AlbumArtistListCountArgs = BaseEndpointArgs & {
    query: ListCountQuery<AlbumArtistListQuery>;
};

export interface AlbumArtistListQuery extends BaseQuery<AlbumArtistListSort> {
    _custom?: Record<string, any>;
    favorite?: boolean;
    limit?: number;
    musicFolderId?: string | string[];
    searchTerm?: string;
    startIndex: number;
}

// Album Artist List
export type AlbumArtistListResponse = BasePaginatedResponse<AlbumArtist[]>;

export type SongDetailArgs = BaseEndpointArgs & { query: SongDetailQuery };

export type SongDetailQuery = { id: string };

// Song Detail
export type SongDetailResponse = Song;

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

export type ArtistListCountArgs = BaseEndpointArgs & { query: ListCountQuery<ArtistListQuery> };

export interface ArtistListQuery extends BaseQuery<ArtistListSort> {
    _custom?: Record<string, any>;
    favorite?: boolean;
    limit?: number;
    musicFolderId?: string | string[];
    role?: string;
    searchTerm?: string;
    startIndex: number;
}

// Artist List
export type ArtistListResponse = BasePaginatedResponse<AlbumArtist[]>;

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

export enum PlaylistListSort {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'owner',
    PUBLIC = 'public',
    SONG_COUNT = 'songCount',
    UPDATED_AT = 'updatedAt',
}

export enum RadioListSort {
    ID = 'id',
    NAME = 'name',
}

export type AddToPlaylistArgs = BaseEndpointArgs & {
    body: AddToPlaylistBody;
    query: AddToPlaylistQuery;
};

export type AddToPlaylistBody = {
    songId: string[];
};

export type AddToPlaylistQuery = {
    id: string;
};

// Add to playlist
export type AddToPlaylistResponse = null | undefined;

export type CreateInternetRadioStationArgs = BaseEndpointArgs & {
    body: CreateInternetRadioStationBody;
};

export type CreateInternetRadioStationBody = {
    homepageUrl?: string;
    name: string;
    streamUrl: string;
};

export type CreateInternetRadioStationResponse = null | undefined;

export type CreatePlaylistArgs = BaseEndpointArgs & { body: CreatePlaylistBody };

export type CreatePlaylistBody = {
    _custom?: Record<string, any>;
    comment?: string;
    name: string;
    ownerId?: string;
    public?: boolean;
    queryBuilderRules?: Record<string, any>;
    sync?: boolean;
};

// Create Playlist
export type CreatePlaylistResponse = undefined | { id: string };

export type DeleteInternetRadioStationArgs = BaseEndpointArgs & {
    query: DeleteInternetRadioStationQuery;
};

export type DeleteInternetRadioStationQuery = {
    id: string;
};

export type DeleteInternetRadioStationResponse = null | undefined;

export type DeletePlaylistArgs = BaseEndpointArgs & {
    query: DeletePlaylistQuery;
};

export type DeletePlaylistQuery = { id: string };

// Delete Playlist
export type DeletePlaylistResponse = null | undefined;

export type FavoriteArgs = BaseEndpointArgs & { query: FavoriteQuery };

export type FavoriteQuery = {
    id: string[];
    type: LibraryItem;
};

// Favorite
export type FavoriteResponse = null | undefined;

export type GetInternetRadioStationsArgs = BaseEndpointArgs;

export type GetInternetRadioStationsResponse = InternetRadioStation[];

export type InternetRadioStation = {
    homepageUrl?: null | string;
    id: string;
    name: string;
    streamUrl: string;
};

export type PlaylistListArgs = BaseEndpointArgs & { query: PlaylistListQuery };

export type PlaylistListCountArgs = BaseEndpointArgs & { query: ListCountQuery<PlaylistListQuery> };

export interface PlaylistListQuery extends BaseQuery<PlaylistListSort> {
    _custom?: Record<string, any>;
    excludeSmartPlaylists?: boolean;
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

// Playlist List
export type PlaylistListResponse = BasePaginatedResponse<Playlist[]>;

export type RatingQuery = {
    id: string[];
    rating: number;
    type: LibraryItem;
};

// Rating
export type RatingResponse = null | undefined;

export type RemoveFromPlaylistArgs = BaseEndpointArgs & {
    query: RemoveFromPlaylistQuery;
};

export type RemoveFromPlaylistQuery = {
    id: string;
    songId: string[];
};

// Remove from playlist
export type RemoveFromPlaylistResponse = null | undefined;

export type ReplacePlaylistArgs = BaseEndpointArgs & {
    body: ReplacePlaylistBody;
    query: ReplacePlaylistQuery;
};

export type ReplacePlaylistBody = {
    songId: string[];
};

export type ReplacePlaylistQuery = {
    id: string;
};

// Replace playlist
export type ReplacePlaylistResponse = null | undefined;

export type SetRatingArgs = BaseEndpointArgs & { query: RatingQuery };

export type ShareItemArgs = BaseEndpointArgs & { body: ShareItemBody };

export type ShareItemBody = {
    description: string;
    downloadable: boolean;
    expires: number;
    resourceIds: string;
    resourceType: string;
};

// Sharing
export type ShareItemResponse = undefined | { id: string };

export type UpdateInternetRadioStationArgs = BaseEndpointArgs & {
    body: UpdateInternetRadioStationBody;
    query: UpdateInternetRadioStationQuery;
};

export type UpdateInternetRadioStationBody = {
    homepageUrl?: string;
    name: string;
    streamUrl: string;
};

export type UpdateInternetRadioStationQuery = {
    id: string;
};

export type UpdateInternetRadioStationResponse = null | undefined;

export type UpdatePlaylistArgs = BaseEndpointArgs & {
    body: UpdatePlaylistBody;
    query: UpdatePlaylistQuery;
};

export type UpdatePlaylistBody = {
    _custom?: Record<string, any>;
    comment?: string;
    genres?: Genre[];
    name: string;
    ownerId?: string;
    public?: boolean;
    queryBuilderRules?: Record<string, any>;
    sync?: boolean;
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
export type MusicFolderListResponse = BasePaginatedResponse<MusicFolder[]>;

export type PlaylistDetailArgs = BaseEndpointArgs & { query: PlaylistDetailQuery };

export type PlaylistDetailQuery = {
    id: string;
};

// Playlist Detail
export type PlaylistDetailResponse = Playlist;

export type PlaylistSongListArgs = BaseEndpointArgs & { query: PlaylistSongListQuery };

export type PlaylistSongListCountArgs = BaseEndpointArgs & {
    query: ListCountQuery<PlaylistSongListQuery>;
};

export type PlaylistSongListQuery = {
    id: string;
};

export type PlaylistSongListQueryClientSide = {
    sortBy?: SongListSort;
    sortOrder?: SortOrder;
};

// Playlist Songs
export type PlaylistSongListResponse = BasePaginatedResponse<Song[]>;

export type UserListArgs = BaseEndpointArgs & { query: UserListQuery };

export interface UserListQuery extends BaseQuery<UserListSort> {
    _custom?: Record<string, any>;
    limit?: number;
    searchTerm?: string;
    startIndex: number;
}

// User list
// Playlist List
export type UserListResponse = BasePaginatedResponse<User[]>;

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
    musicFolderId?: string | string[];
};

export type FullLyricsMetadata = Omit<InternetProviderLyricResponse, 'id' | 'lyrics' | 'source'> & {
    lyrics: LyricsResponse;
    offsetMs?: number;
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
    musicFolderId?: string | string[];
    played: Played;
};

export type RandomSongListResponse = SongListResponse;

export type ScrobbleArgs = BaseEndpointArgs & {
    query: ScrobbleQuery;
};

export type ScrobbleQuery = {
    event?: 'pause' | 'start' | 'timeupdate' | 'unpause';
    id: string;
    position?: number;
    submission: boolean;
};

// Scrobble
export type ScrobbleResponse = null;

export type SearchAlbumArtistsQuery = {
    albumArtistLimit?: number;
    albumArtistStartIndex?: number;
    musicFolderId?: string | string[];
    query?: string;
};

export type SearchAlbumsQuery = {
    albumLimit?: number;
    albumStartIndex?: number;
    musicFolderId?: string | string[];
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
    musicFolderId?: string | string[];
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
    musicFolderId?: string | string[];
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
export type TopSongListResponse = BasePaginatedResponse<Song[]>;

export const instanceOfCancellationError = (error: any) => {
    return 'revert' in error;
};

export enum LyricSource {
    GENIUS = 'Genius',
    LRCLIB = 'lrclib.net',
    NETEASE = 'NetEase',
}

export type ArtistRadioArgs = BaseEndpointArgs & {
    query: ArtistRadioQuery;
};

export type ArtistRadioQuery = {
    artistId: string;
    count?: number;
};

export type ControllerEndpoint = {
    addToPlaylist: (args: AddToPlaylistArgs) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    createFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    createInternetRadioStation: (
        args: CreateInternetRadioStationArgs,
    ) => Promise<CreateInternetRadioStationResponse>;
    createPlaylist: (args: CreatePlaylistArgs) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: FavoriteArgs) => Promise<FavoriteResponse>;
    deleteInternetRadioStation: (
        args: DeleteInternetRadioStationArgs,
    ) => Promise<DeleteInternetRadioStationResponse>;
    deletePlaylist: (args: DeletePlaylistArgs) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (args: AlbumArtistDetailArgs) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (args: AlbumArtistListArgs) => Promise<AlbumArtistListResponse>;
    getAlbumArtistListCount: (args: AlbumArtistListCountArgs) => Promise<number>;
    getAlbumDetail: (args: AlbumDetailArgs) => Promise<AlbumDetailResponse>;
    getAlbumInfo?: (args: AlbumDetailArgs) => Promise<AlbumInfo>;
    getAlbumList: (args: AlbumListArgs) => Promise<AlbumListResponse>;
    getAlbumListCount: (args: AlbumListCountArgs) => Promise<number>;
    getArtistList: (args: ArtistListArgs) => Promise<ArtistListResponse>;
    getArtistListCount: (args: ArtistListCountArgs) => Promise<number>;
    getArtistRadio: (args: ArtistRadioArgs) => Promise<Song[]>;
    getDownloadUrl: (args: DownloadArgs) => string;
    getFolder: (args: FolderArgs) => Promise<FolderResponse>;
    getGenreList: (args: GenreListArgs) => Promise<GenreListResponse>;
    getImageUrl: (args: ImageArgs) => null | string;
    getInternetRadioStations: (
        args: GetInternetRadioStationsArgs,
    ) => Promise<GetInternetRadioStationsResponse>;
    getLyrics?: (args: LyricsArgs) => Promise<LyricsResponse>;
    getMusicFolderList: (args: MusicFolderListArgs) => Promise<MusicFolderListResponse>;
    getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (args: PlaylistListArgs) => Promise<PlaylistListResponse>;
    getPlaylistListCount: (args: PlaylistListCountArgs) => Promise<number>;
    getPlaylistSongList: (args: PlaylistSongListArgs) => Promise<SongListResponse>;
    getPlayQueue: (args: GetQueueArgs) => Promise<GetQueueResponse>;
    getRandomSongList: (args: RandomSongListArgs) => Promise<SongListResponse>;
    getRoles: (args: BaseEndpointArgs) => Promise<Array<string | { label: string; value: string }>>;
    getServerInfo: (args: ServerInfoArgs) => Promise<ServerInfo>;
    getSimilarSongs: (args: SimilarSongsArgs) => Promise<Song[]>;
    getSongDetail: (args: SongDetailArgs) => Promise<SongDetailResponse>;
    getSongList: (args: SongListArgs) => Promise<SongListResponse>;
    getSongListCount: (args: SongListCountArgs) => Promise<number>;
    getStreamUrl: (args: StreamArgs) => string;
    getStructuredLyrics?: (args: StructuredLyricsArgs) => Promise<StructuredLyric[]>;
    getTagList?: (args: TagListArgs) => Promise<TagListResponse>;
    getTopSongs: (args: TopSongListArgs) => Promise<TopSongListResponse>;
    // getArtistInfo?: (args: any) => void;
    getUserInfo: (args: UserInfoArgs) => Promise<UserInfoResponse>;
    getUserList?: (args: UserListArgs) => Promise<UserListResponse>;
    movePlaylistItem?: (args: MoveItemArgs) => Promise<void>;
    removeFromPlaylist: (args: RemoveFromPlaylistArgs) => Promise<RemoveFromPlaylistResponse>;
    replacePlaylist: (args: ReplacePlaylistArgs) => Promise<ReplacePlaylistResponse>;
    savePlayQueue: (args: SaveQueueArgs) => Promise<void>;
    scrobble: (args: ScrobbleArgs) => Promise<ScrobbleResponse>;
    search: (args: SearchArgs) => Promise<SearchResponse>;
    setRating?: (args: SetRatingArgs) => Promise<RatingResponse>;
    shareItem?: (args: ShareItemArgs) => Promise<ShareItemResponse>;
    updateInternetRadioStation: (
        args: UpdateInternetRadioStationArgs,
    ) => Promise<UpdateInternetRadioStationResponse>;
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

export type GetQueueArgs = BaseEndpointArgs;

export interface GetQueueQuery {}

export type GetQueueResponse = {
    changed: string;
    changedBy: string;
    currentIndex: number;
    entry: Song[];
    positionMs: number;
    username: string;
};

export type ImageArgs = BaseEndpointArgs & {
    query: ImageQuery;
};

export type ImageQuery = {
    id: string;
    itemType: LibraryItem;
    size?: number;
};

export type InternalControllerEndpoint = {
    addToPlaylist: (
        args: ReplaceApiClientProps<AddToPlaylistArgs>,
    ) => Promise<AddToPlaylistResponse>;
    authenticate: (
        url: string,
        body: { legacy?: boolean; password: string; username: string },
    ) => Promise<AuthenticationResponse>;
    createFavorite: (args: ReplaceApiClientProps<FavoriteArgs>) => Promise<FavoriteResponse>;
    createInternetRadioStation: (
        args: ReplaceApiClientProps<CreateInternetRadioStationArgs>,
    ) => Promise<CreateInternetRadioStationResponse>;
    createPlaylist: (
        args: ReplaceApiClientProps<CreatePlaylistArgs>,
    ) => Promise<CreatePlaylistResponse>;
    deleteFavorite: (args: ReplaceApiClientProps<FavoriteArgs>) => Promise<FavoriteResponse>;
    deleteInternetRadioStation: (
        args: ReplaceApiClientProps<DeleteInternetRadioStationArgs>,
    ) => Promise<DeleteInternetRadioStationResponse>;
    deletePlaylist: (
        args: ReplaceApiClientProps<DeletePlaylistArgs>,
    ) => Promise<DeletePlaylistResponse>;
    getAlbumArtistDetail: (
        args: ReplaceApiClientProps<AlbumArtistDetailArgs>,
    ) => Promise<AlbumArtistDetailResponse>;
    getAlbumArtistList: (
        args: ReplaceApiClientProps<AlbumArtistListArgs>,
    ) => Promise<AlbumArtistListResponse>;
    getAlbumArtistListCount: (
        args: ReplaceApiClientProps<AlbumArtistListCountArgs>,
    ) => Promise<number>;
    getAlbumDetail: (args: ReplaceApiClientProps<AlbumDetailArgs>) => Promise<AlbumDetailResponse>;
    getAlbumInfo?: (args: ReplaceApiClientProps<AlbumDetailArgs>) => Promise<AlbumInfo>;
    getAlbumList: (args: ReplaceApiClientProps<AlbumListArgs>) => Promise<AlbumListResponse>;
    getAlbumListCount: (args: ReplaceApiClientProps<AlbumListCountArgs>) => Promise<number>;
    // getArtistInfo?: (args: any) => void;
    getArtistList: (args: ReplaceApiClientProps<ArtistListArgs>) => Promise<ArtistListResponse>;
    getArtistListCount: (args: ReplaceApiClientProps<ArtistListCountArgs>) => Promise<number>;
    getArtistRadio: (args: ReplaceApiClientProps<ArtistRadioArgs>) => Promise<Song[]>;
    getDownloadUrl: (args: ReplaceApiClientProps<DownloadArgs>) => string;
    getFolder: (args: ReplaceApiClientProps<FolderArgs>) => Promise<FolderResponse>;
    getGenreList: (args: ReplaceApiClientProps<GenreListArgs>) => Promise<GenreListResponse>;
    getImageUrl: (args: ReplaceApiClientProps<ImageArgs>) => null | string;
    getInternetRadioStations: (
        args: ReplaceApiClientProps<GetInternetRadioStationsArgs>,
    ) => Promise<GetInternetRadioStationsResponse>;
    getLyrics?: (args: ReplaceApiClientProps<LyricsArgs>) => Promise<LyricsResponse>;
    getMusicFolderList: (
        args: ReplaceApiClientProps<MusicFolderListArgs>,
    ) => Promise<MusicFolderListResponse>;
    getPlaylistDetail: (
        args: ReplaceApiClientProps<PlaylistDetailArgs>,
    ) => Promise<PlaylistDetailResponse>;
    getPlaylistList: (
        args: ReplaceApiClientProps<PlaylistListArgs>,
    ) => Promise<PlaylistListResponse>;
    getPlaylistListCount: (args: ReplaceApiClientProps<PlaylistListCountArgs>) => Promise<number>;
    getPlaylistSongList: (
        args: ReplaceApiClientProps<PlaylistSongListArgs>,
    ) => Promise<SongListResponse>;
    getPlayQueue: (args: ReplaceApiClientProps<GetQueueArgs>) => Promise<GetQueueResponse>;
    getRandomSongList: (
        args: ReplaceApiClientProps<RandomSongListArgs>,
    ) => Promise<SongListResponse>;
    getRoles: (
        args: ReplaceApiClientProps<BaseEndpointArgs>,
    ) => Promise<Array<string | { label: string; value: string }>>;
    getServerInfo: (args: ReplaceApiClientProps<ServerInfoArgs>) => Promise<ServerInfo>;
    getSimilarSongs: (args: ReplaceApiClientProps<SimilarSongsArgs>) => Promise<Song[]>;
    getSongDetail: (args: ReplaceApiClientProps<SongDetailArgs>) => Promise<SongDetailResponse>;
    getSongList: (args: ReplaceApiClientProps<SongListArgs>) => Promise<SongListResponse>;
    getSongListCount: (args: ReplaceApiClientProps<SongListCountArgs>) => Promise<number>;
    getStreamUrl: (args: ReplaceApiClientProps<StreamArgs>) => string;
    getStructuredLyrics?: (
        args: ReplaceApiClientProps<StructuredLyricsArgs>,
    ) => Promise<StructuredLyric[]>;
    getTagList?: (args: ReplaceApiClientProps<TagListArgs>) => Promise<TagListResponse>;
    getTopSongs: (args: ReplaceApiClientProps<TopSongListArgs>) => Promise<TopSongListResponse>;
    getUserInfo: (args: ReplaceApiClientProps<UserInfoArgs>) => Promise<UserInfoResponse>;
    getUserList?: (args: ReplaceApiClientProps<UserListArgs>) => Promise<UserListResponse>;
    movePlaylistItem?: (args: ReplaceApiClientProps<MoveItemArgs>) => Promise<void>;
    removeFromPlaylist: (
        args: ReplaceApiClientProps<RemoveFromPlaylistArgs>,
    ) => Promise<RemoveFromPlaylistResponse>;
    replacePlaylist: (
        args: ReplaceApiClientProps<ReplacePlaylistArgs>,
    ) => Promise<ReplacePlaylistResponse>;
    savePlayQueue: (args: ReplaceApiClientProps<SaveQueueArgs>) => Promise<void>;
    scrobble: (args: ReplaceApiClientProps<ScrobbleArgs>) => Promise<ScrobbleResponse>;
    search: (args: ReplaceApiClientProps<SearchArgs>) => Promise<SearchResponse>;
    setRating?: (args: ReplaceApiClientProps<SetRatingArgs>) => Promise<RatingResponse>;
    shareItem?: (args: ReplaceApiClientProps<ShareItemArgs>) => Promise<ShareItemResponse>;
    updateInternetRadioStation: (
        args: ReplaceApiClientProps<UpdateInternetRadioStationArgs>,
    ) => Promise<UpdateInternetRadioStationResponse>;
    updatePlaylist: (
        args: ReplaceApiClientProps<UpdatePlaylistArgs>,
    ) => Promise<UpdatePlaylistResponse>;
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

export type ReplaceApiClientProps<T> = BaseEndpointArgsWithServer & Omit<T, 'apiClientProps'>;

export type SaveQueueArgs = BaseEndpointArgs & {
    query: SaveQueueQuery;
};

export type SaveQueueQuery = {
    currentIndex?: number;
    positionMs?: number;
    songs: string[];
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
    count?: number;
    songId: string;
};

export type StreamArgs = BaseEndpointArgs & {
    query: StreamQuery;
};

export type StreamQuery = {
    bitrate?: number;
    format?: string;
    id: string;
    transcode: boolean;
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
    id: string;
    name: string;
    options: { id: string; name: string }[];
};

export type TagListArgs = BaseEndpointArgs & {
    query: TagListQuery;
};

export type TagListQuery = {
    folder?: string;
    tagName?: string;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
};

export type TagListResponse = {
    boolTags?: string[];
    enumTags?: { name: string; options: { id: string; name: string }[] }[];
    excluded: {
        album: string[];
        song: string[];
    };
};

export type UserInfoArgs = BaseEndpointArgs & { query: UserInfoQuery };

export type UserInfoQuery = {
    id: string;
    username: string;
};

export type UserInfoResponse = {
    id: string;
    isAdmin: boolean;
    name: string;
};

type BaseEndpointArgsWithServer = {
    apiClientProps: {
        server: null | ServerListItemWithCredential;
        serverId: string;
        signal?: AbortSignal;
    };
};
