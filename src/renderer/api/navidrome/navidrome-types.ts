import { z } from 'zod';
import {
    NDAlbumArtistListSort,
    NDAlbumListSort,
    NDPlaylistListSort,
    NDSongListSort,
} from '/@/renderer/api/navidrome.types';

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
    name: z.string().optional(),
});

const genreList = z.array(genre);

const albumArtist = z.object({
    albumCount: z.number(),
    biography: z.string(),
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
    playCount: z.number(),
    playDate: z.string().optional(),
    rating: z.number(),
    size: z.number(),
    smallImageUrl: z.string().optional(),
    songCount: z.number(),
    starred: z.boolean(),
    starredAt: z.string(),
});

const albumArtistList = z.array(albumArtist);

const albumArtistListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDAlbumArtistListSort).optional(),
    genre_id: z.string().optional(),
    name: z.string().optional(),
    starred: z.boolean().optional(),
});

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
    duration: z.number(),
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
    playCount: z.number(),
    playDate: z.string().optional(),
    rating: z.number().optional(),
    releaseDate: z.string().optional(),
    size: z.number(),
    songCount: z.number(),
    sortAlbumArtistName: z.string(),
    sortArtistName: z.string(),
    starred: z.boolean(),
    starredAt: z.string().optional(),
    updatedAt: z.string(),
});

const albumList = z.array(album);

const albumListParameters = paginationParameters.extend({
    _sort: z.nativeEnum(NDAlbumListSort).optional(),
    album_id: z.string().optional(),
    artist_id: z.string().optional(),
    compilation: z.boolean().optional(),
    genre_id: z.string().optional(),
    has_rating: z.boolean().optional(),
    id: z.string().optional(),
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
    externalInfoUpdatedAt: z.string().optional(),
    externalUrl: z.string().optional(),
    fullText: z.string(),
    genre: z.string(),
    genres: z.array(genre).nullable(),
    hasCoverArt: z.boolean(),
    id: z.string(),
    imageFiles: z.string().optional(),
    largeImageUrl: z.string().optional(),
    lyrics: z.string().optional(),
    mbzAlbumArtistId: z.string().optional(),
    mbzAlbumId: z.string().optional(),
    mbzArtistId: z.string().optional(),
    mbzTrackId: z.string().optional(),
    mediumImageUrl: z.string().optional(),
    orderAlbumArtistName: z.string(),
    orderAlbumName: z.string(),
    orderArtistName: z.string(),
    orderTitle: z.string(),
    path: z.string(),
    playCount: z.number(),
    playDate: z.string().optional(),
    rating: z.number().optional(),
    releaseDate: z.string().optional(),
    rgAlbumGain: z.number().optional(),
    rgAlbumPeak: z.number().optional(),
    rgTrackGain: z.number().optional(),
    rgTrackPeak: z.number().optional(),
    size: z.number(),
    smallImageUrl: z.string().optional(),
    sortAlbumArtistName: z.string(),
    sortArtistName: z.string(),
    starred: z.boolean(),
    starredAt: z.string().optional(),
    suffix: z.string(),
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
    genre_id: z.array(z.string()).optional(),
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
        updatePlaylist,
        user,
        userList,
    },
};
