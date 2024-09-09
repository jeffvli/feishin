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
    id: z.string(),
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

const song = z.object({
    album: z.string().optional(),
    albumId: z.string().optional(),
    artist: z.string().optional(),
    artistId: z.string().optional(),
    averageRating: z.number().optional(),
    bitRate: z.number().optional(),
    contentType: z.string(),
    coverArt: z.string().optional(),
    created: z.string(),
    discNumber: z.number(),
    duration: z.number().optional(),
    genre: z.string().optional(),
    id: z.string(),
    isDir: z.boolean(),
    isVideo: z.boolean(),
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
    artistId: z.string(),
    coverArt: z.string(),
    created: z.string(),
    duration: z.number(),
    genre: z.string().optional(),
    id: z.string(),
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
    albumCount: z.string(),
    artistImageUrl: z.string().optional(),
    coverArt: z.string().optional(),
    id: z.string(),
    name: z.string(),
});

const albumArtistList = z.object({
    artist: z.array(albumArtist),
    name: z.string(),
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
    topSongs: z.object({
        song: z.array(song),
    }),
});

const scrobbleParameters = z.object({
    id: z.string(),
    submission: z.boolean().optional(),
    time: z.number().optional(), // The time (in milliseconds since 1 Jan 1970) at which the song was listened to.
});

const scrobble = z.null();

const search3 = z.object({
    searchResult3: z.object({
        album: z.array(album),
        artist: z.array(albumArtist),
        song: z.array(song),
    }),
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
    randomSongs: z.object({
        song: z.array(song),
    }),
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

export const ssType = {
    _parameters: {
        albumList: albumListParameters,
        artistInfo: artistInfoParameters,
        authenticate: authenticateParameters,
        createFavorite: createFavoriteParameters,
        randomSongList: randomSongListParameters,
        removeFavorite: removeFavoriteParameters,
        scrobble: scrobbleParameters,
        search3: search3Parameters,
        setRating: setRatingParameters,
        similarSongs: similarSongsParameters,
        structuredLyrics: structuredLyricsParameters,
        topSongsList: topSongsListParameters,
    },
    _response: {
        album,
        albumArtist,
        albumArtistList,
        albumList,
        artistInfo,
        authenticate,
        baseResponse,
        createFavorite,
        musicFolderList,
        ping,
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
