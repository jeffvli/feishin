import { z } from 'zod';

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
    EXPLICIT_STATUS = 'explicitStatus',
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
    EXPLICIT_STATUS = 'explicitStatus',
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

const sortOrderValues = ['ASC', 'DESC'] as const;

const error = z.string();

const paginationParameters = z.object({
    _end: z.number().optional(),
    _order: z.enum(sortOrderValues),
    _start: z.number().optional(),
});

const authenticate = z.object({
    id: z.string(),
    isAdmin: z.boolean(),
    name: z.string(),
    subsonicSalt: z.string(),
    subsonicToken: z.string(),
    token: z.string(),
    username: z.string(),
});

const authenticateParameters = z.object({
    password: z.string(),
    username: z.string(),
});

const user = z.object({
    createdAt: z.string(),
    email: z.string().optional(),
    id: z.string(),
    isAdmin: z.boolean(),
    lastAccessAt: z.string(),
    lastLoginAt: z.string(),
    name: z.string(),
    updatedAt: z.string(),
    userName: z.string(),
});

const userList = z.array(user);

const ndUserListSort = {
    NAME: 'name',
} as const;

const userListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(ndUserListSort).optional(),
});

const genre = z.object({
    id: z.string(),
    name: z.string(),
});

const genreListSort = {
    NAME: 'name',
    SONG_COUNT: 'songCount',
} as const;

const genreListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(genreListSort).optional(),
    library_id: z.array(z.string()).optional(),
    name: z.string().optional(),
});

const genreList = z.array(genre);

const stats = z.object({
    albumCount: z.number(),
    size: z.number(),
    songCount: z.number(),
});

const albumArtist = z.object({
    albumCount: z.number(),
    biography: z.string(),
    createdAt: z.string().optional(),
    externalInfoUpdatedAt: z.string(),
    externalUrl: z.string(),
    fullText: z.string(),
    genres: z.array(genre).nullable(),
    id: z.string(),
    largeImageUrl: z.string().optional(),
    mbzArtistId: z.string().optional(),
    mediumImageUrl: z.string().optional(),
    name: z.string(),
    orderArtistName: z.string(),
    playCount: z.number().optional(),
    playDate: z.string().optional(),
    rating: z.number(),
    size: z.number(),
    smallImageUrl: z.string().optional(),
    songCount: z.number(),
    starred: z.boolean(),
    starredAt: z.string(),
    stats: z.record(z.string(), stats).optional(),
    updatedAt: z.string().optional(),
});

const albumArtistList = z.array(albumArtist);

const albumArtistListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDAlbumArtistListSort).optional(),
    genre_id: z.string().optional(),
    library_id: z.array(z.string()).optional(),
    missing: z.boolean().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    starred: z.boolean().optional(),
});

const participant = z.object({
    id: z.string(),
    name: z.string(),
    subRole: z.string().optional(),
});

const participants = z.record(z.string(), z.array(participant));

const album = z.object({
    albumArtist: z.string(),
    albumArtistId: z.string(),
    allArtistIds: z.string(),
    artist: z.string(),
    artistId: z.string(),
    comment: z.string().optional(),
    compilation: z.boolean(),
    coverArtId: z.string().optional(), // Removed after v0.48.0
    coverArtPath: z.string().optional(), // Removed after v0.48.0
    createdAt: z.string(),
    duration: z.number().optional(),
    explicitStatus: z.string().optional(),
    fullText: z.string(),
    genre: z.string(),
    genres: z.array(genre).nullable(),
    id: z.string(),
    maxYear: z.number(),
    mbzAlbumArtistId: z.string().optional(),
    mbzAlbumId: z.string().optional(),
    minYear: z.number(),
    name: z.string(),
    orderAlbumArtistName: z.string(),
    orderAlbumName: z.string(),
    originalDate: z.string().optional(),
    originalYear: z.number().optional(),
    participants: z.optional(participants),
    playCount: z.number().optional(),
    playDate: z.string().optional(),
    rating: z.number().optional(),
    releaseDate: z.string().optional(),
    size: z.number(),
    songCount: z.number(),
    sortAlbumArtistName: z.string(),
    sortArtistName: z.string(),
    starred: z.boolean(),
    starredAt: z.string().optional(),
    tags: z.record(z.string(), z.array(z.string())).optional(),
    updatedAt: z.string(),
});

const albumList = z.array(album);

const albumListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDAlbumListSort).optional(),
    album_id: z.string().optional(),
    artist_id: z.string().optional(),
    compilation: z.boolean().optional(),
    // in older versions, this was a single string. post BFR, you can repeat it multiple times
    genre_id: z.union([z.string(), z.string().array()]).optional(),
    has_rating: z.boolean().optional(),
    id: z.string().optional(),
    library_id: z.array(z.string()).optional(),
    name: z.string().optional(),
    recently_added: z.boolean().optional(),
    recently_played: z.boolean().optional(),
    starred: z.boolean().optional(),
    year: z.number().optional(),
});

const song = z.object({
    album: z.string(),
    albumArtist: z.string(),
    albumArtistId: z.string(),
    albumId: z.string(),
    artist: z.string(),
    artistId: z.string(),
    bitDepth: z.number().optional(),
    bitRate: z.number(),
    bookmarkPosition: z.number(),
    bpm: z.number().optional(),
    catalogNum: z.string().optional(),
    channels: z.number().optional(),
    comment: z.string().optional(),
    compilation: z.boolean(),
    createdAt: z.string(),
    discNumber: z.number(),
    discSubtitle: z.string().optional(),
    duration: z.number(),
    embedArtPath: z.string().optional(),
    explicitStatus: z.string().optional(),
    externalInfoUpdatedAt: z.string().optional(),
    externalUrl: z.string().optional(),
    fullText: z.string(),
    genre: z.string(),
    genres: z.array(genre).nullable(),
    hasCoverArt: z.boolean(),
    id: z.string(),
    imageFiles: z.string().optional(),
    largeImageUrl: z.string().optional(),
    libraryPath: z.string().optional(),
    lyrics: z.string().optional(),
    mbzAlbumArtistId: z.string().optional(),
    mbzAlbumId: z.string().optional(),
    mbzArtistId: z.string().optional(),
    mbzReleaseTrackId: z.string().optional(),
    mediumImageUrl: z.string().optional(),
    orderAlbumArtistName: z.string(),
    orderAlbumName: z.string(),
    orderArtistName: z.string(),
    orderTitle: z.string(),
    participants: z.optional(participants),
    path: z.string(),
    playCount: z.number().optional(),
    playDate: z.string().optional(),
    rating: z.number().optional(),
    releaseDate: z.string().optional(),
    rgAlbumGain: z.number().optional(),
    rgAlbumPeak: z.number().optional(),
    rgTrackGain: z.number().optional(),
    rgTrackPeak: z.number().optional(),
    sampleRate: z.number(),
    size: z.number(),
    smallImageUrl: z.string().optional(),
    sortAlbumArtistName: z.string(),
    sortArtistName: z.string(),
    starred: z.boolean(),
    starredAt: z.string().optional(),
    suffix: z.string(),
    tags: z.record(z.string(), z.array(z.string())).optional(),
    title: z.string(),
    trackNumber: z.number(),
    updatedAt: z.string(),
    year: z.number(),
});

const songList = z.array(song);

const songListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDSongListSort).optional(),
    album_artist_id: z.array(z.string()).optional(),
    album_id: z.array(z.string()).optional(),
    artist_id: z.array(z.string()).optional(),
    artists_id: z.array(z.string()).optional(),
    genre_id: z.array(z.string()).optional(),
    library_id: z.array(z.string()).optional(),
    path: z.string().optional(),
    starred: z.boolean().optional(),
    title: z.string().optional(),
    year: z.number().optional(),
});

const playlist = z.object({
    comment: z.string(),
    createdAt: z.string(),
    duration: z.number(),
    evaluatedAt: z.string(),
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    ownerName: z.string(),
    path: z.string(),
    public: z.boolean(),
    rules: z.record(z.string(), z.any()),
    size: z.number(),
    songCount: z.number(),
    sync: z.boolean(),
    updatedAt: z.string(),
});

const playlistList = z.array(playlist);

const playlistListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDPlaylistListSort).optional(),
    owner_id: z.string().optional(),
    q: z.string().optional(),
    smart: z.boolean().optional(),
});

const playlistSong = song.extend({
    mediaFileId: z.string(),
    playlistId: z.string(),
});

const playlistSongList = z.array(playlistSong);

const createPlaylist = playlist.pick({
    id: true,
});

const createPlaylistParameters = z.object({
    comment: z.string().optional(),
    name: z.string(),
    public: z.boolean().optional(),
    rules: z.record(z.any()).optional(),
    sync: z.boolean().optional(),
});

const updatePlaylist = playlist;

const updatePlaylistParameters = createPlaylistParameters.partial();

const deletePlaylist = z.null();

const addToPlaylist = z.object({
    added: z.number(),
});

const addToPlaylistParameters = z.object({
    ids: z.array(z.string()),
});

const removeFromPlaylist = z.object({
    ids: z.array(z.string()),
});

const removeFromPlaylistParameters = z.object({
    id: z.array(z.string()),
});

const shareItem = z.object({
    id: z.string(),
});

const shareItemParameters = z.object({
    description: z.string(),
    downloadable: z.boolean(),
    expires: z.number(),
    resourceIds: z.string(),
    resourceType: z.string(),
});

const moveItemParameters = z.object({
    insert_before: z.string(),
});

const moveItem = z.null();

const tag = z.object({
    albumCount: z.number().optional(),
    id: z.string(),
    songCount: z.number().optional(),
    tagName: z.string(),
    tagValue: z.string(),
});

const tags = z.array(tag);

export const ndType = {
    _enum: {
        albumArtistList: NDAlbumArtistListSort,
        albumList: NDAlbumListSort,
        genreList: genreListSort,
        playlistList: NDPlaylistListSort,
        songList: NDSongListSort,
        userList: ndUserListSort,
    },
    _parameters: {
        addToPlaylist: addToPlaylistParameters,
        albumArtistList: albumArtistListParameters,
        albumList: albumListParameters,
        authenticate: authenticateParameters,
        createPlaylist: createPlaylistParameters,
        genreList: genreListParameters,
        moveItem: moveItemParameters,
        playlistList: playlistListParameters,
        removeFromPlaylist: removeFromPlaylistParameters,
        shareItem: shareItemParameters,
        songList: songListParameters,
        updatePlaylist: updatePlaylistParameters,
        userList: userListParameters,
    },
    _response: {
        addToPlaylist,
        album,
        albumArtist,
        albumArtistList,
        albumList,
        authenticate,
        createPlaylist,
        deletePlaylist,
        error,
        genre,
        genreList,
        moveItem,
        playlist,
        playlistList,
        playlistSong,
        playlistSongList,
        removeFromPlaylist,
        shareItem,
        song,
        songList,
        tags,
        updatePlaylist,
        user,
        userList,
    },
};
