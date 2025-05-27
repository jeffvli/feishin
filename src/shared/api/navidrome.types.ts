import { SSArtistInfo } from '/@/shared/api/subsonic.types';

export enum NDAlbumArtistListSort {
    ALBUM_COUNT = 'albumCount',
    FAVORITED = 'starred_at',
    NAME = 'name',
    PLAY_COUNT = 'playCount',
    RATING = 'rating',
    SONG_COUNT = 'songCount',
}

export enum NDAlbumListSort {
    ALBUM_ARTIST = 'album_artist',
    ARTIST = 'artist',
    DURATION = 'duration',
    NAME = 'name',
    PLAY_COUNT = 'play_count',
    PLAY_DATE = 'play_date',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'recently_added',
    SONG_COUNT = 'songCount',
    STARRED = 'starred_at',
    YEAR = 'max_year',
}

export enum NDGenreListSort {
    NAME = 'name',
}

export enum NDPlaylistListSort {
    DURATION = 'duration',
    NAME = 'name',
    OWNER = 'owner_name',
    PUBLIC = 'public',
    SONG_COUNT = 'songCount',
    UPDATED_AT = 'updatedAt',
}

export enum NDSongListSort {
    ALBUM = 'album',
    ALBUM_ARTIST = 'order_album_artist_name',
    ALBUM_SONGS = 'album',
    ARTIST = 'artist',
    BPM = 'bpm',
    CHANNELS = 'channels',
    COMMENT = 'comment',
    DURATION = 'duration',
    FAVORITED = 'starred_at',
    GENRE = 'genre',
    ID = 'id',
    PLAY_COUNT = 'playCount',
    PLAY_DATE = 'playDate',
    RANDOM = 'random',
    RATING = 'rating',
    RECENTLY_ADDED = 'createdAt',
    TITLE = 'title',
    TRACK = 'track',
    YEAR = 'year',
}

export enum NDSortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export type NDAddToPlaylist = null;

export type NDAddToPlaylistBody = {
    ids: string[];
};

export type NDAddToPlaylistResponse = {
    added: number;
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

export type NDAlbumArtistDetail = NDAlbumArtist;

export type NDAlbumArtistDetailResponse = NDAlbumArtist;

export type NDAlbumArtistList = {
    items: NDAlbumArtist[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDAlbumArtistListParams = NDOrder &
    NDPagination & {
        _sort?: NDAlbumArtistListSort;
        genre_id?: string;
        starred?: boolean;
    };

export type NDAlbumDetail = NDAlbum & { songs?: NDSongListResponse };

export type NDAlbumDetailResponse = NDAlbum;

export type NDAlbumList = {
    items: NDAlbum[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDAlbumListParams = NDOrder &
    NDPagination & {
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
    };

export type NDAlbumListResponse = NDAlbum[];

export type NDArtistListResponse = NDAlbumArtist[];

export type NDAuthenticate = {
    id: string;
    isAdmin: boolean;
    name: string;
    subsonicSalt: string;
    subsonicToken: string;
    token: string;
    username: string;
};

export type NDAuthenticationResponse = NDAuthenticate;

export type NDCreatePlaylist = NDCreatePlaylistResponse;

export type NDCreatePlaylistParams = {
    comment?: string;
    name: string;
    public?: boolean;
    rules?: null | Record<string, unknown>;
};

export type NDCreatePlaylistResponse = {
    id: string;
};

export type NDDeletePlaylist = NDDeletePlaylistResponse;

export type NDDeletePlaylistParams = {
    id: string;
};

export type NDDeletePlaylistResponse = null;

export type NDGenre = {
    id: string;
    name: string;
};

export type NDGenreList = NDGenre[];

export type NDGenreListParams = NDOrder &
    NDPagination & {
        _sort?: NDGenreListSort;
        id?: string;
    };

export type NDGenreListResponse = NDGenre[];

export type NDOrder = {
    _order?: NDSortOrder;
};

export type NDPagination = {
    _end?: number;
    _start?: number;
};

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
    rules: null | Record<string, unknown>;
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

export type NDPlaylistListParams = NDOrder &
    NDPagination & {
        _sort?: NDPlaylistListSort;
        owner_id?: string;
    };

export type NDPlaylistListResponse = NDPlaylist[];

export type NDPlaylistSong = NDSong & {
    mediaFileId: string;
    playlistId: string;
};

export type NDPlaylistSongList = {
    items: NDPlaylistSong[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDPlaylistSongListResponse = NDPlaylistSong[];

export type NDRemoveFromPlaylist = null;

export type NDRemoveFromPlaylistParams = {
    id: string[];
};

export type NDRemoveFromPlaylistResponse = {
    ids: string[];
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

export type NDSongDetail = NDSong;

export type NDSongDetailResponse = NDSong;

export type NDSongList = {
    items: NDSong[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDSongListParams = NDOrder &
    NDPagination & {
        _sort?: NDSongListSort;
        album_id?: string[];
        artist_id?: string[];
        genre_id?: string;
        starred?: boolean;
    };

export type NDSongListResponse = NDSong[];

export type NDUpdatePlaylistParams = Partial<NDPlaylist>;

export type NDUpdatePlaylistResponse = NDPlaylist;

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

export const NDSongQueryFields = [
    { label: 'Album', type: 'string', value: 'album' },
    { label: 'Album Artist', type: 'string', value: 'albumartist' },
    { label: 'Album Artists', type: 'string', value: 'albumartists' },
    { label: 'Album Comment', type: 'string', value: 'albumcomment' },
    { label: 'Album Type', type: 'string', value: 'albumtype' },
    { label: 'Album Version', type: 'string', value: 'albumversion' },
    { label: 'Arranger', type: 'string', value: 'arranger' },
    { label: 'Artist', type: 'string', value: 'artist' },
    { label: 'Artists', type: 'string', value: 'artists' },
    { label: 'Barcode', type: 'string', value: 'barcode' },
    { label: 'Bitrate', type: 'number', value: 'bitrate' },
    { label: 'BPM', type: 'number', value: 'bpm' },
    { label: 'Catalog Number', type: 'string', value: 'catalognumber' },
    { label: 'Channels', type: 'number', value: 'channels' },
    { label: 'Comment', type: 'string', value: 'comment' },
    { label: 'Composer', type: 'string', value: 'composer' },
    { label: 'Conductor', type: 'string', value: 'conductor' },
    { label: 'Copyright', type: 'string', value: 'copyright' },
    { label: 'Date Added', type: 'date', value: 'dateadded' },
    { label: 'Date Favorited', type: 'date', value: 'dateloved' },
    { label: 'Date Last Played', type: 'date', value: 'lastplayed' },
    { label: 'Date Modified', type: 'date', value: 'datemodified' },
    { label: 'DJ Mixer', type: 'string', value: 'djmixer' },
    { label: 'Director', type: 'string', value: 'director' },
    { label: 'Disc Number', type: 'number', value: 'discnumber' },
    { label: 'Disc Subtitle', type: 'string', value: 'discsubtitle' },
    { label: 'Disc Total', type: 'number', value: 'disctotal' },
    { label: 'Duration', type: 'number', value: 'duration' },
    { label: 'Encoded By', type: 'string', value: 'encodedby' },
    { label: 'Encoder Settings', type: 'string', value: 'encodersettings' },
    { label: 'Engineer', type: 'string', value: 'engineer' },
    { label: 'Explicit Status', type: 'string', value: 'explicitstatus' },
    { label: 'File Path', type: 'string', value: 'filepath' },
    { label: 'File Type', type: 'string', value: 'filetype' },
    { label: 'Genre', type: 'string', value: 'genre' },
    { label: 'Grouping', type: 'string', value: 'grouping' },
    { label: 'Has CoverArt', type: 'boolean', value: 'hascoverart' },
    { label: 'Is Compilation', type: 'boolean', value: 'compilation' },
    { label: 'Is Favorite', type: 'boolean', value: 'loved' },
    { label: 'ISRC', type: 'string', value: 'isrc' },
    { label: 'Key', type: 'string', value: 'key' },
    { label: 'Language', type: 'string', value: 'language' },
    { label: 'License', type: 'string', value: 'license' },
    { label: 'Lyricist', type: 'string', value: 'lyricist' },
    { label: 'Lyrics', type: 'string', value: 'lyrics' },
    { label: 'Media', type: 'string', value: 'media' },
    { label: 'Mixer', type: 'string', value: 'mixer' },
    { label: 'Mood', type: 'string', value: 'mood' },
    { label: 'Movement', type: 'string', value: 'movement' },
    { label: 'Movement Name', type: 'string', value: 'movementname' },
    { label: 'Movement Total', type: 'number', value: 'movementtotal' },
    { label: 'MusicBrainz Artist Id', type: 'string', value: 'musicbrainz_artistid' },
    { label: 'MusicBrainz Album Artist Id', type: 'string', value: 'musicbrainz_albumartistid' },
    { label: 'MusicBrainz Album Id', type: 'string', value: 'musicbrainz_albumid' },
    { label: 'MusicBrainz Disc Id', type: 'string', value: 'musicbrainz_discid' },
    { label: 'MusicBrainz Recording Id', type: 'string', value: 'musicbrainz_recordingid' },
    { label: 'MusicBrainz Release Group Id', type: 'string', value: 'musicbrainz_releasegroupid' },
    { label: 'MusicBrainz Track Id', type: 'string', value: 'musicbrainz_trackid' },
    { label: 'MusicBrainz Work Id', type: 'string', value: 'musicbrainz_workid' },
    { label: 'Name', type: 'string', value: 'title' },
    { label: 'Original Date', type: 'date', value: 'originaldate' },
    { label: 'Performer', type: 'string', value: 'performer' },
    { label: 'Play Count', type: 'number', value: 'playcount' },
    { label: 'Playlist', type: 'playlist', value: 'id' },
    { label: 'Producer', type: 'string', value: 'producer' },
    { label: 'R128 Album Gain', type: 'number', value: 'r128_album_gain' },
    { label: 'R128 Track Gain', type: 'number', value: 'r128_track_gain' },
    { label: 'Rating', type: 'number', value: 'rating' },
    { label: 'Record Label', type: 'string', value: 'recordlabel' },
    { label: 'Recording Date', type: 'date', value: 'recordingdate' },
    { label: 'Release Country', type: 'string', value: 'releasecountry' },
    { label: 'Release Date', type: 'date', value: 'releasedate' },
    { label: 'Release Status', type: 'string', value: 'releasestatus' },
    { label: 'Release Type', type: 'string', value: 'releasetype' },
    { label: 'ReplayGain Album Gain', type: 'number', value: 'replaygain_album_gain' },
    { label: 'ReplayGain Album Peak', type: 'number', value: 'replaygain_album_peak' },
    { label: 'ReplayGain Track Gain', type: 'number', value: 'replaygain_track_gain' },
    { label: 'ReplayGain Track Peak', type: 'number', value: 'replaygain_track_peak' },
    { label: 'Remixer', type: 'string', value: 'remixer' },
    { label: 'Script', type: 'string', value: 'script' },
    { label: 'Size', type: 'number', value: 'size' },
    { label: 'Sort Album', type: 'string', value: 'albumsort' },
    { label: 'Sort Album Artist', type: 'string', value: 'albumartistsort' },
    { label: 'Sort Album Artists', type: 'string', value: 'albumartistssort' },
    { label: 'Sort Artist', type: 'string', value: 'artistsort' },
    { label: 'Sort Artists', type: 'string', value: 'artistssort' },
    { label: 'Sort Composer', type: 'string', value: 'composersort' },
    { label: 'Sort Lyricist', type: 'string', value: 'lyricistsort' },
    { label: 'Sort Name', type: 'string', value: 'titlesort' },
    { label: 'Subtitle', type: 'string', value: 'subtitle' },
    { label: 'Track Number', type: 'number', value: 'track' },
    { label: 'Track Total', type: 'number', value: 'tracktotal' },
    { label: 'Year', type: 'number', value: 'year' },
    { label: 'Website', type: 'string', value: 'website' },
    { label: 'Work', type: 'string', value: 'work' },
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

export enum NDUserListSort {
    NAME = 'name',
}

export type NDUserList = {
    items: NDUser[];
    startIndex: number;
    totalRecordCount: number;
};

export type NDUserListParams = NDOrder &
    NDPagination & {
        _sort?: NDUserListSort;
    };

export type NDUserListResponse = NDUser[];
