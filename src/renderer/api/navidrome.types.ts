import { SSArtistInfo } from '/@/renderer/api/subsonic.types';

export type NDAuthenticate = {
    id: string;
    isAdmin: boolean;
    name: string;
    subsonicSalt: string;
    subsonicToken: string;
    token: string;
    username: string;
};

export type NDUser = {
    createdAt: string;
    email: string;
    id: string;
    isAdmin: boolean;
    lastAccessAt: string;
    lastLoginAt: string;
    name: string;
    updatedAt: string;
    userName: string;
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
    coverArtId?: string; // Removed after v0.48.0
    coverArtPath?: string; // Removed after v0.48.0
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
} & { songs?: NDSong[] };

export type NDSong = {
    album: string;
    albumArtist: string;
    albumArtistId: string;
    albumId: string;
    artist: string;
    artistId: string;
    bitRate: number;
    bookmarkPosition: number;
    bpm?: number;
    channels?: number;
    comment?: string;
    compilation: boolean;
    createdAt: string;
    discNumber: number;
    duration: number;
    fullText: string;
    genre: string;
    genres: NDGenre[];
    hasCoverArt: boolean;
    id: string;
    lyrics?: string;
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

export type NDAlbumArtist = {
    albumCount: number;
    biography: string;
    externalInfoUpdatedAt: string;
    externalUrl: string;
    fullText: string;
    genres: NDGenre[];
    id: string;
    largeImageUrl?: string;
    mbzArtistId: string;
    mediumImageUrl?: string;
    name: string;
    orderArtistName: string;
    playCount: number;
    playDate: string;
    rating: number;
    size: number;
    smallImageUrl?: string;
    songCount: number;
    starred: boolean;
    starredAt: string;
} & {
    similarArtists?: SSArtistInfo['similarArtist'];
};

export type NDAuthenticationResponse = NDAuthenticate;

export type NDAlbumArtistList = {
    items: NDAlbumArtist[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDAlbumArtistDetail = NDAlbumArtist;

export type NDAlbumArtistDetailResponse = NDAlbumArtist;

export type NDGenreList = NDGenre[];

export type NDGenreListResponse = NDGenre[];

export type NDAlbumDetailResponse = NDAlbum;

export type NDAlbumDetail = NDAlbum & { songs?: NDSongListResponse };

export type NDAlbumListResponse = NDAlbum[];

export type NDAlbumList = {
    items: NDAlbum[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDSongDetail = NDSong;

export type NDSongDetailResponse = NDSong;

export type NDSongListResponse = NDSong[];

export type NDSongList = {
    items: NDSong[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDArtistListResponse = NDAlbumArtist[];

export type NDPagination = {
    _end?: number;
    _start?: number;
};

export enum NDSortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export type NDOrder = {
    _order?: NDSortOrder;
};

export enum NDGenreListSort {
    NAME = 'name',
}

export type NDGenreListParams = {
    _sort?: NDGenreListSort;
    id?: string;
} & NDPagination &
    NDOrder;

export enum NDAlbumListSort {
    ALBUM_ARTIST = 'albumArtist',
    ARTIST = 'artist',
    DURATION = 'duration',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    PLAY_DATE = 'play_date',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recently_added',
    SONG_COUNT = 'songCount',
    STARRED = 'starred',
    YEAR = 'max_year',
}

export type NDAlbumListParams = {
    _sort?: NDAlbumListSort;
    album_id?: string;
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

export enum NDSongListSort {
    ALBUM = 'album, order_album_artist_name, disc_number, track_number, title',
    ALBUM_ARTIST = 'order_album_artist_name, album, disc_number, track_number, title',
    ALBUM_SONGS = 'album, discNumber, trackNumber',
    ARTIST = 'artist',
    BPM = 'bpm',
    CHANNELS = 'channels',
    COMMENT = 'comment',
    DURATION = 'duration',
    FAVORITED = 'starred ASC, starredAt ASC',
    GENRE = 'genre',
    ID = 'id',
    PLAY_COUNT = 'playCount',
    PLAY_DATE = 'playDate',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'createdAt',
    TITLE = 'title',
    TRACK = 'track',
    YEAR = 'year, album, discNumber, trackNumber',
}

export type NDSongListParams = {
    _sort?: NDSongListSort;
    album_id?: string[];
    artist_id?: string[];
    genre_id?: string;
    starred?: boolean;
} & NDPagination &
    NDOrder;

export enum NDAlbumArtistListSort {
    ALBUM_COUNT = 'albumCount',
    FAVORITED = 'starred ASC, starredAt ASC',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RATING = 'rating',
    SONG_COUNT = 'songCount',
}

export type NDAlbumArtistListParams = {
    _sort?: NDAlbumArtistListSort;
    genre_id?: string;
    starred?: boolean;
} & NDPagination &
    NDOrder;

export type NDAddToPlaylistResponse = {
    added: number;
};

export type NDAddToPlaylistBody = {
    ids: string[];
};

export type NDAddToPlaylist = null;

export type NDRemoveFromPlaylistResponse = {
    ids: string[];
};

export type NDRemoveFromPlaylistParams = {
    id: string[];
};

export type NDRemoveFromPlaylist = null;

export type NDCreatePlaylistParams = {
    comment?: string;
    name: string;
    public?: boolean;
    rules?: Record<string, any> | null;
};

export type NDCreatePlaylistResponse = {
    id: string;
};

export type NDCreatePlaylist = NDCreatePlaylistResponse;

export type NDUpdatePlaylistParams = Partial<NDPlaylist>;

export type NDUpdatePlaylistResponse = NDPlaylist;

export type NDDeletePlaylistParams = {
    id: string;
};

export type NDDeletePlaylistResponse = null;

export type NDDeletePlaylist = NDDeletePlaylistResponse;

export type NDPlaylist = {
    comment: string;
    createdAt: string;
    duration: number;
    evaluatedAt: string;
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    path: string;
    public: boolean;
    rules: Record<string, any> | null;
    size: number;
    songCount: number;
    sync: boolean;
    updatedAt: string;
};

export type NDPlaylistDetail = NDPlaylist;

export type NDPlaylistDetailResponse = NDPlaylist;

export type NDPlaylistList = {
    items: NDPlaylist[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDPlaylistListResponse = NDPlaylist[];

export enum NDPlaylistListSort {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'ownerName',
    PUBLIC = 'public',
    SONG_COUNT = 'songCount',
    UPDATED_AT = 'updatedAt',
}

export type NDPlaylistListParams = {
    _sort?: NDPlaylistListSort;
    owner_id?: string;
} & NDPagination &
    NDOrder;

export type NDPlaylistSong = NDSong & {
    mediaFileId: string;
    playlistId: string;
};

export type NDPlaylistSongListResponse = NDPlaylistSong[];

export type NDPlaylistSongList = {
    items: NDPlaylistSong[];
    startIndex: number;
    totalRecordCount: number;
};

export const NDSongQueryFields = [
    { label: 'Album', type: 'string', value: 'album' },
    { label: 'Album Artist', type: 'string', value: 'albumartist' },
    { label: 'Album Comment', type: 'string', value: 'albumcomment' },
    { label: 'Album Type', type: 'string', value: 'albumtype' },
    { label: 'Artist', type: 'string', value: 'artist' },
    { label: 'Bitrate', type: 'number', value: 'bitrate' },
    { label: 'BPM', type: 'number', value: 'bpm' },
    { label: 'Catalog Number', type: 'string', value: 'catalognumber' },
    { label: 'Channels', type: 'number', value: 'channels' },
    { label: 'Comment', type: 'string', value: 'comment' },
    { label: 'Date Added', type: 'date', value: 'dateadded' },
    { label: 'Date Favorited', type: 'date', value: 'dateloved' },
    { label: 'Date Last Played', type: 'date', value: 'lastplayed' },
    { label: 'Date Modified', type: 'date', value: 'datemodified' },
    { label: 'Disc Subtitle', type: 'string', value: 'discsubtitle' },
    { label: 'Disc Number', type: 'number', value: 'discnumber' },
    { label: 'Duration', type: 'number', value: 'duration' },
    { label: 'File Path', type: 'string', value: 'filepath' },
    { label: 'File Type', type: 'string', value: 'filetype' },
    { label: 'Genre', type: 'string', value: 'genre' },
    { label: 'Has CoverArt', type: 'boolean', value: 'hascoverart' },
    { label: 'Playlist', type: 'playlist', value: 'id' },
    { label: 'Is Compilation', type: 'boolean', value: 'compilation' },
    { label: 'Is Favorite', type: 'boolean', value: 'loved' },
    { label: 'Lyrics', type: 'string', value: 'lyrics' },
    { label: 'Name', type: 'string', value: 'title' },
    { label: 'Play Count', type: 'number', value: 'playcount' },
    { label: 'Rating', type: 'number', value: 'rating' },
    { label: 'Size', type: 'number', value: 'size' },
    { label: 'Sort Album', type: 'string', value: 'sortalbum' },
    { label: 'Sort Album Artist', type: 'string', value: 'sortalbumartist' },
    { label: 'Sort Artist', type: 'string', value: 'sortartist' },
    { label: 'Sort Name', type: 'string', value: 'sorttitle' },
    { label: 'Track Number', type: 'number', value: 'tracknumber' },
    { label: 'Year', type: 'number', value: 'year' },
];

export const NDSongQueryPlaylistOperators = [
    { label: 'is in', value: 'inPlaylist' },
    { label: 'is not in', value: 'notInPlaylist' },
];

export const NDSongQueryDateOperators = [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'isNot' },
    { label: 'is before', value: 'before' },
    { label: 'is after', value: 'after' },
    { label: 'is in the last', value: 'inTheLast' },
    { label: 'is not in the last', value: 'notInTheLast' },
    { label: 'is in the range', value: 'inTheRange' },
];

export const NDSongQueryStringOperators = [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'isNot' },
    { label: 'contains', value: 'contains' },
    { label: 'does not contain', value: 'notContains' },
    { label: 'starts with', value: 'startsWith' },
    { label: 'ends with', value: 'endsWith' },
];

export const NDSongQueryBooleanOperators = [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'isNot' },
];

export const NDSongQueryNumberOperators = [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'isNot' },
    { label: 'contains', value: 'contains' },
    { label: 'does not contain', value: 'notContains' },
    { label: 'is greater than', value: 'gt' },
    { label: 'is less than', value: 'lt' },
    { label: 'is in the range', value: 'inTheRange' },
];

export type NDUserListParams = {
    _sort?: NDUserListSort;
} & NDPagination &
    NDOrder;

export type NDUserListResponse = NDUser[];

export type NDUserList = {
    items: NDUser[];
    startIndex: number;
    totalRecordCount: number;
};

export enum NDUserListSort {
    NAME = 'name',
}
