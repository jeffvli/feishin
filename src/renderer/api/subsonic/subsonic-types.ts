import { z } from 'zod';

const baseResponse = z.object({
    'subsonic-response': z
        .object({
            status: z.string(),
            version: z.string(),
        })
        // OpenSubsonic v1.0.0
        .extend({
            openSubsonic: z.boolean().optional(),
            serverVersion: z.string().optional(),
            type: z.string().optional(),
        }),
});

const baseResponseShape = baseResponse.shape['subsonic-response'];

const musicFolder = z.object({
    id: z.string(),
    name: z.string(),
});

const genre = z.object({
    albumCount: z.number(),
    songCount: z.number(),
    value: z.string(),
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

const albumListEntry = album.omit({
    song: true,
});

const artist = z
    .object({
        album: z.array(album),
        albumCount: z.string(),
        coverArt: z.string().optional(),
        id: z.string(),
        name: z.string(),
        starred: z.string().optional(),
    })
    // Navidrome lastfm extension
    .extend({
        artistImageUrl: z.string().optional(),
    });

const artistListEntry = artist.pick({
    albumCount: true,
    coverArt: true,
    id: true,
    name: true,
    starred: true,
});

const playlist = z.object({
    changed: z.string().optional(),
    comment: z.string().optional(),
    coverArt: z.string().optional(),
    created: z.string(),
    duration: z.number(),
    entry: z.array(song),
    id: z.string(),
    name: z.string(),
    owner: z.string(),
    public: z.boolean(),
    songCount: z.number(),
});

const share = z.object({
    created: z.string(),
    description: z.string().optional(),
    entry: z.array(song),
    expires: z.string().optional(),
    id: z.string(),
    lastVisited: z.string().optional(),
    name: z.string(),
    public: z.boolean(),
    url: z.string(),
    username: z.string(),
    visitCount: z.number(),
});

const user = z.object({
    adminRole: z.boolean(),
    commentRole: z.boolean(),
    downloadRole: z.boolean(),
    email: z.string(),
    folder: z.array(z.number()),
    jukeboxRole: z.boolean(),
    playlistRole: z.boolean(),
    podcastRole: z.boolean(),
    scrobblingEnabled: z.boolean(),
    settingsRole: z.boolean(),
    shareRole: z.boolean(),
    uploadRole: z.boolean(),
    username: z.string(),
});

const shareListEntry = share.omit({
    entry: true,
});

const playlistListEntry = playlist.omit({
    entry: true,
});

const artistInfo = z.object({
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
});

const albumInfo = z.object({
    largeImageUrl: z.string().optional(),
    lastFmUrl: z.string().optional(),
    mediumImageUrl: z.string().optional(),
    musicBrainzId: z.string().optional(),
    notes: z.string().optional(),
    smallImageUrl: z.string().optional(),
});

const ping = {
    parameters: z.object({}),
    response: baseResponse,
};

const getLicense = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            license: z.object({
                email: z.string(),
                licenseExpires: z.string(),
                trialExpires: z.string(),
                valid: z.boolean(),
            }),
        }),
    }),
};

const getOpenSubsonicExtensions = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            openSubsonicExtensions: z.object({
                name: z.string(),
                version: z.array(z.number()),
            }),
        }),
    }),
};

const getMusicFolders = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            musicFolders: z.object({
                musicFolder: z.array(musicFolder),
            }),
        }),
    }),
};

const getIndexes = {
    parameters: z.object({
        ifModifiedSince: z.number().optional(),
        musicFolderId: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            indexes: z.object({
                ignoredArticles: z.string(),
                index: z.array(
                    z.object({
                        artist: z.array(
                            z.object({
                                albumCount: z.number(),
                                coverArt: z.string().optional(),
                                id: z.string(),
                                name: z.string(),
                            }),
                        ),
                        name: z.string(),
                    }),
                ),
                lastModified: z.number(),
            }),
        }),
    }),
};

const getMusicDirectory = {
    parameters: z.object({
        id: z.string(),
        musicFolderId: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            directory: z.object({
                child: z.array(
                    z.object({
                        artist: z.string().optional(),
                        coverArt: z.string().optional(),
                        id: z.string(),
                        isDir: z.boolean(),
                        parent: z.string(),
                        title: z.string(),
                    }),
                ),
                childCount: z.number(),
                coverArt: z.string().optional(),
                id: z.string(),
                name: z.string(),
                parent: z.string(),
            }),
        }),
    }),
};

const getGenres = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            genres: z.object({
                genre: z.array(genre),
            }),
        }),
    }),
};

const getArtists = {
    parameters: z.object({
        musicFolderId: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            artists: z.object({
                ignoredArticles: z.string(),
                index: z.array(
                    z.object({
                        artist: z.array(artistListEntry),
                        name: z.string(),
                    }),
                ),
            }),
        }),
    }),
};

const getArtist = {
    parameters: z.object({
        id: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            artist,
        }),
    }),
};

const getAlbum = {
    parameters: z.object({
        id: z.string(),
        musicFolderId: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            album,
        }),
    }),
};

const getSong = {
    parameters: z.object({
        id: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            song,
        }),
    }),
};

const getArtistInfo = {
    parameters: z.object({
        count: z.number().optional(),
        id: z.string(),

        // Whether to return artists that are not present in the media library.
        includeNotPresent: z.boolean().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            artistInfo,
        }),
    }),
};

const getArtistInfo2 = {
    parameters: getArtistInfo.parameters,
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            artistInfo2: artistInfo,
        }),
    }),
};

const getAlbumInfo = {
    parameters: z.object({
        id: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            albumInfo,
        }),
    }),
};

const getAlbumInfo2 = {
    parameters: getAlbumInfo.parameters,
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            albumInfo2: albumInfo,
        }),
    }),
};

const getSimilarSongs = {
    parameters: z.object({
        count: z.number().optional(),
        id: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            similarSongs: z.object({
                song: z.array(song),
            }),
        }),
    }),
};

const getSimilarSongs2 = {
    parameters: getSimilarSongs.parameters,
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            similarSongs2: z.object({
                song: z.array(song),
            }),
        }),
    }),
};

const getTopSongs = {
    parameters: z.object({
        artist: z.string(),
        count: z.number().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            topSongs: z.object({
                song: z.array(song),
            }),
        }),
    }),
};

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

const getAlbumList = {
    enum: {
        AlbumListSortType,
    },
    parameters: z
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
        ),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            albumList: z.object({
                album: z.array(albumListEntry),
            }),
        }),
    }),
};

const getAlbumList2 = {
    enum: getAlbumList.enum,
    parameters: getAlbumList.parameters,
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            albumList2: z.object({
                album: z.array(albumListEntry),
            }),
        }),
    }),
};

const getRandomSongs = {
    parameters: z.object({
        fromYear: z.number().optional(),
        genre: z.string().optional(),
        musicFolderId: z.string().optional(),
        size: z.number().optional(),
        toYear: z.number().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            randomSongs: z.object({
                song: z.array(song),
            }),
        }),
    }),
};

const getSongsByGenre = {
    parameters: z.object({
        count: z.number().optional(),
        genre: z.string(),
        musicFolderId: z.string().optional(),
        offset: z.number().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            songsByGenre: z.object({
                song: z.array(song),
            }),
        }),
    }),
};

const getNowPlaying = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            nowPlaying: z.object({
                entry: z.array(
                    z.object({
                        minutesAgo: z.number(),
                        playerId: z.number(),
                        song,
                        username: z.string(),
                    }),
                ),
            }),
        }),
    }),
};

const getStarred = {
    parameters: z.object({
        musicFolderId: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            starred: z.object({
                album: z.array(albumListEntry),
                artist: z.array(artistListEntry),
                song: z.array(song),
            }),
        }),
    }),
};

const getStarred2 = {
    parameters: getStarred.parameters,
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            starred2: z.object({
                album: z.array(albumListEntry),
                artist: z.array(artistListEntry),
                song: z.array(song),
            }),
        }),
    }),
};

const search3 = {
    parameters: z.object({
        albumCount: z.number().optional(),
        albumOffset: z.number().optional(),
        artistCount: z.number().optional(),
        artistOffset: z.number().optional(),
        musicFolderId: z.string().optional(),
        query: z.string().or(z.literal('""')),
        songCount: z.number().optional(),
        songOffset: z.number().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            searchResult3: z.object({
                album: z.array(albumListEntry),
                artist: z.array(artistListEntry),
                song: z.array(song),
            }),
        }),
    }),
};

const getPlaylists = {
    parameters: z.object({
        username: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            playlists: z.object({
                playlist: z.array(playlistListEntry),
            }),
        }),
    }),
};

const getPlaylist = {
    parameters: z.object({
        id: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            playlist,
        }),
    }),
};

const createPlaylist = {
    parameters: z.object({
        name: z.string(),
        playlistId: z.string().optional(),
        songId: z.array(z.string()).optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            playlist,
        }),
    }),
};

const updatePlaylist = {
    parameters: z.object({
        comment: z.string().optional(),
        name: z.string().optional(),
        playlistId: z.string(),
        public: z.boolean().optional(),
        songIdToAdd: z.array(z.string()).optional(),
        songIdToRemove: z.array(z.string()).optional(),
    }),
    response: baseResponse,
};

const deletePlaylist = {
    parameters: z.object({
        id: z.string(),
    }),
    response: baseResponse,
};

const getLyrics = {
    parameters: z.object({
        artist: z.string().optional(),
        title: z.string().optional(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            lyrics: z.object({
                artist: z.string(),
                title: z.string(),
                value: z.string(),
            }),
        }),
    }),
};

const star = {
    parameters: z.object({
        albumId: z.array(z.string()).optional(),
        artistId: z.array(z.string()).optional(),
        id: z.array(z.string()).optional(),
    }),
    response: baseResponse,
};

const unstar = {
    parameters: z.object({
        albumId: z.array(z.string()).optional(),
        artistId: z.array(z.string()).optional(),
        id: z.array(z.string()).optional(),
    }),
    response: baseResponse,
};

const setRating = {
    parameters: z.object({
        id: z.string(),
        rating: z.number(),
    }),
    response: baseResponse,
};

const scrobble = {
    parameters: z.object({
        id: z.string(),
        submission: z.boolean().optional(), // Whether this is a “submission” or a “now playing” notification.
        time: z.number().optional(), // The time (in milliseconds since 1 Jan 1970) at which the song was listened to.
    }),
    response: baseResponse,
};

const getShares = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            shares: z.object({
                share: z.array(shareListEntry),
            }),
        }),
    }),
};

const createShare = {
    parameters: z.object({
        description: z.string().optional(),
        expires: z.number().optional(),
        id: z.array(z.string()),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            shares: z.object({
                share: z.array(shareListEntry),
            }),
        }),
    }),
};

const updateShare = {
    parameters: z.object({
        description: z.string().optional(),
        expires: z.number().optional(),
        id: z.string(),
    }),
    response: baseResponse,
};

const deleteShare = {
    parameters: z.object({
        id: z.string(),
    }),
    response: baseResponse,
};

const getInternetRadioStations = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            internetRadioStations: z.object({
                entry: z.array(
                    z.object({
                        id: z.string(),
                        name: z.string(),
                        streamUrl: z.string(),
                    }),
                ),
            }),
        }),
    }),
};

const createInternetRadioStation = {
    parameters: z.object({
        homePageUrl: z.string().optional(),
        name: z.string(),
        streamUrl: z.string(),
    }),
    response: baseResponse,
};

const updateInternetRadioStation = {
    parameters: z.object({
        homePageUrl: z.string().optional(),
        id: z.string(),
        name: z.string(),
        streamUrl: z.string(),
    }),
    response: baseResponse,
};

const deleteInternetRadioStation = {
    parameters: z.object({
        id: z.string(),
    }),
    response: baseResponse,
};

const getUser = {
    parameters: z.object({
        username: z.string(),
    }),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            user,
        }),
    }),
};

const getUsers = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            users: z.object({
                user: z.array(user),
            }),
        }),
    }),
};

const createUser = {
    parameters: z.object({
        adminRole: z.boolean().optional(),
        commentRole: z.boolean().optional(),
        coverArtRole: z.boolean().optional(),
        downloadRole: z.boolean().optional(),
        email: z.string(),
        folder: z.array(z.number()).optional(),
        jukeboxRole: z.boolean().optional(),
        ldapAuthenticated: z.boolean().optional(),
        musicFolderId: z.array(z.string()).optional(),
        password: z.string(),
        playlistRole: z.boolean().optional(),
        podcastRole: z.boolean().optional(),
        scrobblingEnabled: z.boolean().optional(),
        settingsRole: z.boolean().optional(),
        shareRole: z.boolean().optional(),
        streamRole: z.boolean().optional(),
        uploadRole: z.boolean().optional(),
        username: z.string(),
    }),
    response: baseResponse,
};

const updateUser = {
    parameters: z.object({
        adminRole: z.boolean().optional(),
        commentRole: z.boolean().optional(),
        coverArtRole: z.boolean().optional(),
        downloadRole: z.boolean().optional(),
        email: z.string().optional(),
        folder: z.array(z.number()).optional(),
        jukeboxRole: z.boolean().optional(),
        ldapAuthenticated: z.boolean().optional(),
        musicFolderId: z.array(z.string()).optional(),
        password: z.string().optional(),
        playlistRole: z.boolean().optional(),
        podcastRole: z.boolean().optional(),
        scrobblingEnabled: z.boolean().optional(),
        settingsRole: z.boolean().optional(),
        shareRole: z.boolean().optional(),
        streamRole: z.boolean().optional(),
        uploadRole: z.boolean().optional(),
        username: z.string(),
    }),
    response: baseResponse,
};

const deleteUser = {
    parameters: z.object({
        username: z.string(),
    }),
    response: baseResponse,
};

const changePassword = {
    parameters: z.object({
        password: z.string(),
    }),
    response: baseResponse,
};

const getScanStatus = {
    parameters: z.object({}),
    response: z.object({
        'subsonic-response': baseResponseShape.extend({
            scanStatus: z.object({
                count: z.number(),
                scanning: z.boolean(),
            }),
        }),
    }),
};

const startScan = {
    parameters: z.object({}),
    response: baseResponse,
};

export const SubsonicApi = {
    _baseTypes: {
        album,
        albumInfo,
        albumListEntry,
        artist,
        artistInfo,
        artistListEntry,
        baseResponse,
        genre,
        musicFolder,
        playlist,
        playlistListEntry,
        share,
        shareListEntry,
        song,
        user,
    },
    changePassword,
    createInternetRadioStation,
    createPlaylist,
    createShare,
    createUser,
    deleteInternetRadioStation,
    deletePlaylist,
    deleteShare,
    deleteUser,
    getAlbum,
    getAlbumInfo,
    getAlbumInfo2,
    getAlbumList,
    getAlbumList2,
    getArtist,
    getArtistInfo,
    getArtistInfo2,
    getArtists,
    getGenres,
    getIndexes,
    getInternetRadioStations,
    getLicense,
    getLyrics,
    getMusicDirectory,
    getMusicFolders,
    getNowPlaying,
    getOpenSubsonicExtensions,
    getPlaylist,
    getPlaylists,
    getRandomSongs,
    getScanStatus,
    getShares,
    getSimilarSongs,
    getSimilarSongs2,
    getSong,
    getSongsByGenre,
    getStarred,
    getStarred2,
    getTopSongs,
    getUser,
    getUsers,
    ping,
    scrobble,
    search3,
    setRating,
    star,
    startScan,
    unstar,
    updateInternetRadioStation,
    updatePlaylist,
    updateShare,
    updateUser,
};
