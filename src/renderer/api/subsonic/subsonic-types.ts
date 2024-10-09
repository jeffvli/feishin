import { z } from 'zod';

const baseResponse = z.object({
    'subsonic-response': z.object({
        status: z.string(),
        version: z.string(),
    }),
});

const authenticate = z.null();

const authenticateParameters = z.object({
    c: z.string(),
    f: z.string(),
    p: z.string().optional(),
    s: z.string().optional(),
    t: z.string().optional(),
    u: z.string(),
    v: z.string(),
});

const id = z.number().or(z.string());

const createFavoriteParameters = z.object({
    albumId: z.array(z.string()).optional(),
    artistId: z.array(z.string()).optional(),
    id: z.array(z.string()).optional(),
});

const createFavorite = z.null();

const removeFavoriteParameters = z.object({
    albumId: z.array(z.string()).optional(),
    artistId: z.array(z.string()).optional(),
    id: z.array(z.string()).optional(),
});

const removeFavorite = z.null();

const setRatingParameters = z.object({
    id: z.string(),
    rating: z.number(),
});

const setRating = z.null();

const musicFolder = z.object({
    id,
    name: z.string(),
});

const musicFolderList = z.object({
    musicFolders: z.object({
        musicFolder: z.array(musicFolder),
    }),
});

const songGain = z.object({
    albumGain: z.number().optional(),
    albumPeak: z.number().optional(),
    trackGain: z.number().optional(),
    trackPeak: z.number().optional(),
});

const genreItem = z.object({
    name: z.string(),
});

const song = z.object({
    album: z.string().optional(),
    albumId: id.optional(),
    artist: z.string().optional(),
    artistId: id.optional(),
    averageRating: z.number().optional(),
    bitRate: z.number().optional(),
    bpm: z.number().optional(),
    contentType: z.string(),
    coverArt: z.string().optional(),
    created: z.string(),
    discNumber: z.number(),
    duration: z.number().optional(),
    genre: z.string().optional(),
    genres: z.array(genreItem).optional(),
    id,
    isDir: z.boolean(),
    isVideo: z.boolean(),
    musicBrainzId: z.string().optional(),
    parent: z.string(),
    path: z.string(),
    playCount: z.number().optional(),
    replayGain: songGain.optional(),
    size: z.number(),
    starred: z.boolean().optional(),
    suffix: z.string(),
    title: z.string(),
    track: z.number().optional(),
    type: z.string(),
    userRating: z.number().optional(),
    year: z.number().optional(),
});

const album = z.object({
    album: z.string(),
    artist: z.string(),
    artistId: id,
    coverArt: z.string(),
    created: z.string(),
    duration: z.number(),
    genre: z.string().optional(),
    id,
    isCompilation: z.boolean().optional(),
    isDir: z.boolean(),
    isVideo: z.boolean(),
    name: z.string(),
    parent: z.string(),
    song: z.array(song),
    songCount: z.number(),
    starred: z.boolean().optional(),
    title: z.string(),
    userRating: z.number().optional(),
    year: z.number().optional(),
});

const albumListEntry = album.omit({
    song: true,
});

const albumListParameters = z.object({
    fromYear: z.number().optional(),
    genre: z.string().optional(),
    musicFolderId: z.string().optional(),
    offset: z.number().optional(),
    size: z.number().optional(),
    toYear: z.number().optional(),
    type: z.string().optional(),
});

const albumList = z.array(album.omit({ song: true }));

const albumArtist = z.object({
    album: z.array(album),
    albumCount: z.string(),
    artistImageUrl: z.string().optional(),
    coverArt: z.string().optional(),
    id,
    name: z.string(),
    starred: z.string().optional(),
});

const albumArtistList = z.object({
    artist: z.array(albumArtist),
    name: z.string(),
});

const artistListEntry = albumArtist.pick({
    albumCount: true,
    coverArt: true,
    id: true,
    name: true,
    starred: true,
});

const artistInfoParameters = z.object({
    count: z.number().optional(),
    id: z.string(),
    includeNotPresent: z.boolean().optional(),
});

const artistInfo = z.object({
    artistInfo: z.object({
        biography: z.string().optional(),
        largeImageUrl: z.string().optional(),
        lastFmUrl: z.string().optional(),
        mediumImageUrl: z.string().optional(),
        musicBrainzId: z.string().optional(),
        similarArtist: z.array(
            z.object({
                albumCount: z.string(),
                artistImageUrl: z.string().optional(),
                coverArt: z.string().optional(),
                id: z.string(),
                name: z.string(),
            }),
        ),
        smallImageUrl: z.string().optional(),
    }),
});

const topSongsListParameters = z.object({
    artist: z.string(), // The name of the artist, not the artist ID
    count: z.number().optional(),
});

const topSongsList = z.object({
    topSongs: z
        .object({
            song: z.array(song),
        })
        .optional(),
});

const scrobbleParameters = z.object({
    id: z.string(),
    submission: z.boolean().optional(),
    time: z.number().optional(), // The time (in milliseconds since 1 Jan 1970) at which the song was listened to.
});

const scrobble = z.null();

const search3 = z.object({
    searchResult3: z
        .object({
            album: z.array(album).optional(),
            artist: z.array(albumArtist).optional(),
            song: z.array(song).optional(),
        })
        .optional(),
});

const search3Parameters = z.object({
    albumCount: z.number().optional(),
    albumOffset: z.number().optional(),
    artistCount: z.number().optional(),
    artistOffset: z.number().optional(),
    musicFolderId: z.string().optional(),
    query: z.string().optional(),
    songCount: z.number().optional(),
    songOffset: z.number().optional(),
});

const randomSongListParameters = z.object({
    fromYear: z.number().optional(),
    genre: z.string().optional(),
    musicFolderId: z.string().optional(),
    size: z.number().optional(),
    toYear: z.number().optional(),
});

const randomSongList = z.object({
    randomSongs: z
        .object({
            song: z.array(song),
        })
        .optional(),
});

const ping = z.object({
    openSubsonic: z.boolean().optional(),
    serverVersion: z.string().optional(),
    version: z.string(),
});

const extension = z.object({
    name: z.string(),
    versions: z.number().array(),
});

const serverInfo = z.object({
    openSubsonicExtensions: z.array(extension).optional(),
});

const structuredLyricsParameters = z.object({
    id: z.string(),
});

const lyricLine = z.object({
    start: z.number().optional(),
    value: z.string(),
});

const structuredLyric = z.object({
    displayArtist: z.string().optional(),
    displayTitle: z.string().optional(),
    lang: z.string(),
    line: z.array(lyricLine),
    offset: z.number().optional(),
    synced: z.boolean(),
});

const structuredLyrics = z.object({
    lyricsList: z
        .object({
            structuredLyrics: z.array(structuredLyric).optional(),
        })
        .optional(),
});

const similarSongsParameters = z.object({
    count: z.number().optional(),
    id: z.string(),
});

const similarSongs = z.object({
    similarSongs: z
        .object({
            song: z.array(song),
        })
        .optional(),
});

export enum SubsonicExtensions {
    FORM_POST = 'formPost',
    SONG_LYRICS = 'songLyrics',
    TRANSCODE_OFFSET = 'transcodeOffset',
}

const updatePlaylistParameters = z.object({
    comment: z.string().optional(),
    name: z.string().optional(),
    playlistId: z.string(),
    public: z.boolean().optional(),
    songIdToAdd: z.array(z.string()).optional(),
    songIndexToRemove: z.array(z.string()).optional(),
});

const getStarredParameters = z.object({
    musicFolderId: z.string().optional(),
});

const getStarred = z.object({
    starred: z
        .object({
            album: z.array(albumListEntry),
            artist: z.array(artistListEntry),
            song: z.array(song),
        })
        .optional(),
});

const getSongsByGenreParameters = z.object({
    count: z.number().optional(),
    genre: z.string(),
    musicFolderId: z.string().optional(),
    offset: z.number().optional(),
});

const getSongsByGenre = z.object({
    songsByGenre: z
        .object({
            song: z.array(song),
        })
        .optional(),
});

const getAlbumParameters = z.object({
    id: z.string(),
    musicFolderId: z.string().optional(),
});

const getAlbum = z.object({
    album,
});

const getArtistParameters = z.object({
    id: z.string(),
});

const getArtist = z.object({
    artist: albumArtist,
});

const getSongParameters = z.object({
    id: z.string(),
});

const getSong = z.object({
    song,
});

const getArtistsParameters = z.object({
    musicFolderId: z.string().optional(),
});

const getArtists = z.object({
    artists: z.object({
        ignoredArticles: z.string(),
        index: z.array(
            z.object({
                artist: z.array(artistListEntry),
                name: z.string(),
            }),
        ),
    }),
});

const deletePlaylistParameters = z.object({
    id: z.string(),
});

const createPlaylistParameters = z.object({
    name: z.string(),
    playlistId: z.string().optional(),
    songId: z.array(z.string()).optional(),
});

const playlist = z.object({
    changed: z.string().optional(),
    comment: z.string().optional(),
    coverArt: z.string().optional(),
    created: z.string(),
    duration: z.number(),
    entry: z.array(song).optional(),
    id,
    name: z.string(),
    owner: z.string(),
    public: z.boolean(),
    songCount: z.number(),
});

const createPlaylist = z.object({
    playlist,
});

const getPlaylistsParameters = z.object({
    username: z.string().optional(),
});

const playlistListEntry = playlist.omit({
    entry: true,
});

const getPlaylists = z.object({
    playlists: z
        .object({
            playlist: z.array(playlistListEntry),
        })
        .optional(),
});

const getPlaylistParameters = z.object({
    id: z.string(),
});

const getPlaylist = z.object({
    playlist,
});

const genre = z.object({
    albumCount: z.number(),
    songCount: z.number(),
    value: z.string(),
});

const getGenresParameters = z.object({});

const getGenres = z.object({
    genres: z
        .object({
            genre: z.array(genre),
        })
        .optional(),
});

export enum AlbumListSortType {
    ALPHABETICAL_BY_ARTIST = 'alphabeticalByArtist',
    ALPHABETICAL_BY_NAME = 'alphabeticalByName',
    BY_GENRE = 'byGenre',
    BY_YEAR = 'byYear',
    FREQUENT = 'frequent',
    NEWEST = 'newest',
    RANDOM = 'random',
    RECENT = 'recent',
    STARRED = 'starred',
}

const getAlbumList2Parameters = z
    .object({
        fromYear: z.number().optional(),
        genre: z.string().optional(),
        musicFolderId: z.string().optional(),
        offset: z.number().optional(),
        size: z.number().optional(),
        toYear: z.number().optional(),
        type: z.nativeEnum(AlbumListSortType),
    })
    .refine(
        (val) => {
            if (val.type === AlbumListSortType.BY_YEAR) {
                return val.fromYear !== undefined && val.toYear !== undefined;
            }

            return true;
        },
        {
            message: 'Parameters "fromYear" and "toYear" are required when using sort "byYear"',
        },
    )
    .refine(
        (val) => {
            if (val.type === AlbumListSortType.BY_GENRE) {
                return val.genre !== undefined;
            }

            return true;
        },
        { message: 'Parameter "genre" is required when using sort "byGenre"' },
    );

const getAlbumList2 = z.object({
    albumList2: z.object({
        album: z.array(albumListEntry),
    }),
});

export const ssType = {
    _parameters: {
        albumList: albumListParameters,
        artistInfo: artistInfoParameters,
        authenticate: authenticateParameters,
        createFavorite: createFavoriteParameters,
        createPlaylist: createPlaylistParameters,
        deletePlaylist: deletePlaylistParameters,
        getAlbum: getAlbumParameters,
        getAlbumList2: getAlbumList2Parameters,
        getArtist: getArtistParameters,
        getArtists: getArtistsParameters,
        getGenre: getGenresParameters,
        getGenres: getGenresParameters,
        getPlaylist: getPlaylistParameters,
        getPlaylists: getPlaylistsParameters,
        getSong: getSongParameters,
        getSongsByGenre: getSongsByGenreParameters,
        getStarred: getStarredParameters,
        randomSongList: randomSongListParameters,
        removeFavorite: removeFavoriteParameters,
        scrobble: scrobbleParameters,
        search3: search3Parameters,
        setRating: setRatingParameters,
        similarSongs: similarSongsParameters,
        structuredLyrics: structuredLyricsParameters,
        topSongsList: topSongsListParameters,
        updatePlaylist: updatePlaylistParameters,
    },
    _response: {
        album,
        albumArtist,
        albumArtistList,
        albumList,
        albumListEntry,
        artistInfo,
        artistListEntry,
        authenticate,
        baseResponse,
        createFavorite,
        createPlaylist,
        genre,
        getAlbum,
        getAlbumList2,
        getArtist,
        getArtists,
        getGenres,
        getPlaylist,
        getPlaylists,
        getSong,
        getSongsByGenre,
        getStarred,
        musicFolderList,
        ping,
        playlist,
        playlistListEntry,
        randomSongList,
        removeFavorite,
        scrobble,
        search3,
        serverInfo,
        setRating,
        similarSongs,
        song,
        structuredLyrics,
        topSongsList,
    },
};
