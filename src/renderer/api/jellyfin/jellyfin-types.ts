import { z } from 'zod';

const sortOrderValues = ['Ascending', 'Descending'] as const;

const jfExternal = {
    IMDB: 'Imdb',
    MUSIC_BRAINZ: 'MusicBrainz',
    THE_AUDIO_DB: 'TheAudioDb',
    THE_MOVIE_DB: 'TheMovieDb',
    TVDB: 'Tvdb',
};

const jfImage = {
    BACKDROP: 'Backdrop',
    BANNER: 'Banner',
    BOX: 'Box',
    CHAPTER: 'Chapter',
    DISC: 'Disc',
    LOGO: 'Logo',
    PRIMARY: 'Primary',
    THUMB: 'Thumb',
} as const;

const jfCollection = {
    MUSIC: 'music',
    PLAYLISTS: 'playlists',
} as const;

const error = z.object({
    errors: z.object({
        recursive: z.array(z.string()),
    }),
    status: z.number(),
    title: z.string(),
    traceId: z.string(),
    type: z.string(),
});

const baseParameters = z.object({
    AlbumArtistIds: z.string().optional(),
    ArtistIds: z.string().optional(),
    ContributingArtistIds: z.string().optional(),
    EnableImageTypes: z.string().optional(),
    EnableTotalRecordCount: z.boolean().optional(),
    EnableUserData: z.boolean().optional(),
    EnableUserDataTypes: z.boolean().optional(),
    ExcludeArtistIds: z.string().optional(),
    ExcludeItemIds: z.string().optional(),
    ExcludeItemTypes: z.string().optional(),
    Fields: z.string().optional(),
    ImageTypeLimit: z.number().optional(),
    IncludeArtists: z.boolean().optional(),
    IncludeGenres: z.boolean().optional(),
    IncludeItemTypes: z.string().optional(),
    IncludeMedia: z.boolean().optional(),
    IncludePeople: z.boolean().optional(),
    IncludeStudios: z.boolean().optional(),
    IsFavorite: z.boolean().optional(),
    Limit: z.number().optional(),
    MediaTypes: z.string().optional(),
    NameStartsWith: z.string().optional(),
    ParentId: z.string().optional(),
    Recursive: z.boolean().optional(),
    SearchTerm: z.string().optional(),
    SortBy: z.string().optional(),
    SortOrder: z.enum(sortOrderValues).optional(),
    StartIndex: z.number().optional(),
    Tags: z.string().optional(),
    UserId: z.string().optional(),
    Years: z.string().optional(),
});

const paginationParameters = z.object({
    Limit: z.number().optional(),
    SortOrder: z.enum(sortOrderValues).optional(),
    StartIndex: z.number().optional(),
});

const pagination = z.object({
    StartIndex: z.number(),
    TotalRecordCount: z.number(),
});

const imageTags = z.object({
    Logo: z.string().optional(),
    Primary: z.string().optional(),
});

const imageBlurHashes = z.object({
    Backdrop: z.record(z.string(), z.string()).optional(),
    Logo: z.record(z.string(), z.string()).optional(),
    Primary: z.record(z.string(), z.string()).optional(),
});

const userData = z.object({
    IsFavorite: z.boolean(),
    Key: z.string(),
    PlayCount: z.number(),
    PlaybackPositionTicks: z.number(),
    Played: z.boolean(),
});

const externalUrl = z.object({
    Name: z.string(),
    Url: z.string(),
});

const mediaStream = z.object({
    AspectRatio: z.string().optional(),
    BitDepth: z.number().optional(),
    BitRate: z.number().optional(),
    ChannelLayout: z.string().optional(),
    Channels: z.number().optional(),
    Codec: z.string(),
    CodecTimeBase: z.string(),
    ColorSpace: z.string().optional(),
    Comment: z.string().optional(),
    DisplayTitle: z.string().optional(),
    Height: z.number().optional(),
    Index: z.number(),
    IsDefault: z.boolean(),
    IsExternal: z.boolean(),
    IsForced: z.boolean(),
    IsInterlaced: z.boolean(),
    IsTextSubtitleStream: z.boolean(),
    Level: z.number(),
    PixelFormat: z.string().optional(),
    Profile: z.string().optional(),
    RealFrameRate: z.number().optional(),
    RefFrames: z.number().optional(),
    SampleRate: z.number().optional(),
    SupportsExternalStream: z.boolean(),
    TimeBase: z.string(),
    Type: z.string(),
    Width: z.number().optional(),
});

const mediaSources = z.object({
    Bitrate: z.number(),
    Container: z.string(),
    DefaultAudioStreamIndex: z.number(),
    ETag: z.string(),
    Formats: z.array(z.any()),
    GenPtsInput: z.boolean(),
    Id: z.string(),
    IgnoreDts: z.boolean(),
    IgnoreIndex: z.boolean(),
    IsInfiniteStream: z.boolean(),
    IsRemote: z.boolean(),
    MediaAttachments: z.array(z.any()),
    MediaStreams: z.array(mediaStream),
    Name: z.string(),
    Path: z.string(),
    Protocol: z.string(),
    ReadAtNativeFramerate: z.boolean(),
    RequiredHttpHeaders: z.any(),
    RequiresClosing: z.boolean(),
    RequiresLooping: z.boolean(),
    RequiresOpening: z.boolean(),
    RunTimeTicks: z.number(),
    Size: z.number(),
    SupportsDirectPlay: z.boolean(),
    SupportsDirectStream: z.boolean(),
    SupportsProbing: z.boolean(),
    SupportsTranscoding: z.boolean(),
    Type: z.string(),
});

const sessionInfo = z.object({
    AdditionalUsers: z.array(z.any()),
    ApplicationVersion: z.string(),
    Capabilities: z.object({
        PlayableMediaTypes: z.array(z.any()),
        SupportedCommands: z.array(z.any()),
        SupportsContentUploading: z.boolean(),
        SupportsMediaControl: z.boolean(),
        SupportsPersistentIdentifier: z.boolean(),
        SupportsSync: z.boolean(),
    }),
    Client: z.string(),
    DeviceId: z.string(),
    DeviceName: z.string(),
    HasCustomDeviceName: z.boolean(),
    Id: z.string(),
    IsActive: z.boolean(),
    LastActivityDate: z.string(),
    LastPlaybackCheckIn: z.string(),
    NowPlayingItem: z.any().optional(),
    NowPlayingQueue: z.array(z.any()),
    NowPlayingQueueFullItems: z.array(z.any()),
    PlayState: z.object({
        CanSeek: z.boolean(),
        IsMuted: z.boolean(),
        IsPaused: z.boolean(),
        PositionTicks: z.number().optional(),
        RepeatMode: z.string(),
    }),
    PlayableMediaTypes: z.array(z.any()),
    RemoteEndPoint: z.string(),
    ServerId: z.string(),
    SupportedCommands: z.array(z.any()),
    SupportsMediaControl: z.boolean(),
    SupportsRemoteControl: z.boolean(),
    UserId: z.string(),
    UserName: z.string(),
});

const configuration = z.object({
    DisplayCollectionsView: z.boolean(),
    DisplayMissingEpisodes: z.boolean(),
    EnableLocalPassword: z.boolean(),
    EnableNextEpisodeAutoPlay: z.boolean(),
    GroupedFolders: z.array(z.any()),
    HidePlayedInLatest: z.boolean(),
    LatestItemsExcludes: z.array(z.any()),
    MyMediaExcludes: z.array(z.any()),
    OrderedViews: z.array(z.any()),
    PlayDefaultAudioTrack: z.boolean(),
    RememberAudioSelections: z.boolean(),
    RememberSubtitleSelections: z.boolean(),
    SubtitleLanguagePreference: z.string(),
    SubtitleMode: z.string(),
});

const policy = z.object({
    AccessSchedules: z.array(z.any()),
    AuthenticationProviderId: z.string(),
    BlockUnratedItems: z.array(z.any()),
    BlockedChannels: z.array(z.any()),
    BlockedMediaFolders: z.array(z.any()),
    BlockedTags: z.array(z.any()),
    EnableAllChannels: z.boolean(),
    EnableAllDevices: z.boolean(),
    EnableAllFolders: z.boolean(),
    EnableAudioPlaybackTranscoding: z.boolean(),
    EnableContentDeletion: z.boolean(),
    EnableContentDeletionFromFolders: z.array(z.any()),
    EnableContentDownloading: z.boolean(),
    EnableLiveTvAccess: z.boolean(),
    EnableLiveTvManagement: z.boolean(),
    EnableMediaConversion: z.boolean(),
    EnableMediaPlayback: z.boolean(),
    EnablePlaybackRemuxing: z.boolean(),
    EnablePublicSharing: z.boolean(),
    EnableRemoteAccess: z.boolean(),
    EnableRemoteControlOfOtherUsers: z.boolean(),
    EnableSharedDeviceControl: z.boolean(),
    EnableSyncTranscoding: z.boolean(),
    EnableUserPreferenceAccess: z.boolean(),
    EnableVideoPlaybackTranscoding: z.boolean(),
    EnabledChannels: z.array(z.any()),
    EnabledDevices: z.array(z.any()),
    EnabledFolders: z.array(z.any()),
    ForceRemoteSourceTranscoding: z.boolean(),
    InvalidLoginAttemptCount: z.number(),
    IsAdministrator: z.boolean(),
    IsDisabled: z.boolean(),
    IsHidden: z.boolean(),
    LoginAttemptsBeforeLockout: z.number(),
    MaxActiveSessions: z.number(),
    PasswordResetProviderId: z.string(),
    RemoteClientBitrateLimit: z.number(),
    SyncPlayAccess: z.string(),
});

const user = z.object({
    Configuration: configuration,
    EnableAutoLogin: z.boolean(),
    HasConfiguredEasyPassword: z.boolean(),
    HasConfiguredPassword: z.boolean(),
    HasPassword: z.boolean(),
    Id: z.string(),
    LastActivityDate: z.string(),
    LastLoginDate: z.string(),
    Name: z.string(),
    Policy: policy,
    ServerId: z.string(),
});

const authenticateParameters = z.object({
    Pw: z.string(),
    Username: z.string(),
});

const authenticate = z.object({
    AccessToken: z.string(),
    ServerId: z.string(),
    SessionInfo: sessionInfo,
    User: user,
});

const genreItem = z.object({
    Id: z.string(),
    Name: z.string(),
});

const genre = z.object({
    BackdropImageTags: z.array(z.any()),
    ChannelId: z.null(),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    LocationType: z.string(),
    Name: z.string(),
    ServerId: z.string(),
    Type: z.string(),
});

const genreList = pagination.extend({
    Items: z.array(genre),
});

const genreListSort = {
    NAME: 'SortName',
} as const;

const genreListParameters = paginationParameters.merge(
    baseParameters.extend({
        SearchTerm: z.string().optional(),
        SortBy: z.nativeEnum(genreListSort).optional(),
    }),
);

const musicFolder = z.object({
    BackdropImageTags: z.array(z.string()),
    ChannelId: z.null(),
    CollectionType: z.string(),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    IsFolder: z.boolean(),
    LocationType: z.string(),
    Name: z.string(),
    ServerId: z.string(),
    Type: z.string(),
    UserData: userData,
});

const musicFolderListParameters = z.object({
    UserId: z.string(),
});

const musicFolderList = z.object({
    Items: z.array(musicFolder),
});

const playlist = z.object({
    BackdropImageTags: z.array(z.string()),
    ChannelId: z.null(),
    ChildCount: z.number().optional(),
    DateCreated: z.string(),
    GenreItems: z.array(genreItem),
    Genres: z.array(z.string()),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    IsFolder: z.boolean(),
    LocationType: z.string(),
    MediaType: z.string(),
    Name: z.string(),
    Overview: z.string().optional(),
    RunTimeTicks: z.number(),
    ServerId: z.string(),
    Type: z.string(),
    UserData: userData,
});

const playlistListSort = {
    ALBUM_ARTIST: 'AlbumArtist,SortName',
    DURATION: 'Runtime',
    NAME: 'SortName',
    RECENTLY_ADDED: 'DateCreated,SortName',
    SONG_COUNT: 'ChildCount',
} as const;

const playlistListParameters = paginationParameters.merge(
    baseParameters.extend({
        IncludeItemTypes: z.literal('Playlist'),
        SortBy: z.nativeEnum(playlistListSort).optional(),
    }),
);

const playlistList = pagination.extend({
    Items: z.array(playlist),
});

const genericItem = z.object({
    Id: z.string(),
    Name: z.string(),
});

const song = z.object({
    Album: z.string(),
    AlbumArtist: z.string(),
    AlbumArtists: z.array(genericItem),
    AlbumId: z.string(),
    AlbumPrimaryImageTag: z.string(),
    ArtistItems: z.array(genericItem),
    Artists: z.array(z.string()),
    BackdropImageTags: z.array(z.string()),
    ChannelId: z.null(),
    DateCreated: z.string(),
    ExternalUrls: z.array(externalUrl),
    GenreItems: z.array(genericItem),
    Genres: z.array(z.string()),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    IndexNumber: z.number(),
    IsFolder: z.boolean(),
    LocationType: z.string(),
    MediaSources: z.array(mediaSources),
    MediaType: z.string(),
    Name: z.string(),
    ParentIndexNumber: z.number(),
    PlaylistItemId: z.string().optional(),
    PremiereDate: z.string().optional(),
    ProductionYear: z.number(),
    RunTimeTicks: z.number(),
    ServerId: z.string(),
    SortName: z.string(),
    Type: z.string(),
    UserData: userData.optional(),
});

const albumArtist = z.object({
    BackdropImageTags: z.array(z.string()),
    ChannelId: z.null(),
    DateCreated: z.string(),
    ExternalUrls: z.array(externalUrl),
    GenreItems: z.array(genreItem),
    Genres: z.array(z.string()),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    LocationType: z.string(),
    Name: z.string(),
    Overview: z.string(),
    RunTimeTicks: z.number(),
    ServerId: z.string(),
    Type: z.string(),
    UserData: userData.optional(),
});

const albumDetailParameters = baseParameters;

const album = z.object({
    AlbumArtist: z.string(),
    AlbumArtists: z.array(genericItem),
    AlbumPrimaryImageTag: z.string(),
    ArtistItems: z.array(genericItem),
    Artists: z.array(z.string()),
    ChannelId: z.null(),
    ChildCount: z.number().optional(),
    DateCreated: z.string(),
    DateLastMediaAdded: z.string().optional(),
    ExternalUrls: z.array(externalUrl),
    GenreItems: z.array(genericItem),
    Genres: z.array(z.string()),
    Id: z.string(),
    ImageBlurHashes: imageBlurHashes,
    ImageTags: imageTags,
    IsFolder: z.boolean(),
    LocationType: z.string(),
    Name: z.string(),
    ParentLogoImageTag: z.string(),
    ParentLogoItemId: z.string(),
    PremiereDate: z.string().optional(),
    ProductionYear: z.number(),
    RunTimeTicks: z.number(),
    ServerId: z.string(),
    Songs: z.array(song).optional(), // This is not a native Jellyfin property -- this is used for combined album detail
    Type: z.string(),
    UserData: userData.optional(),
});

const albumListSort = {
    ALBUM_ARTIST: 'AlbumArtist,SortName',
    COMMUNITY_RATING: 'CommunityRating,SortName',
    CRITIC_RATING: 'CriticRating,SortName',
    NAME: 'SortName',
    RANDOM: 'Random,SortName',
    RECENTLY_ADDED: 'DateCreated,SortName',
    RELEASE_DATE: 'ProductionYear,PremiereDate,SortName',
} as const;

const albumListParameters = paginationParameters.merge(
    baseParameters.extend({
        Filters: z.string().optional(),
        GenreIds: z.string().optional(),
        Genres: z.string().optional(),
        IncludeItemTypes: z.literal('MusicAlbum'),
        IsFavorite: z.boolean().optional(),
        SearchTerm: z.string().optional(),
        SortBy: z.nativeEnum(albumListSort).optional(),
        Tags: z.string().optional(),
        Years: z.string().optional(),
    }),
);

const albumList = pagination.extend({
    Items: z.array(album),
});

const albumArtistListSort = {
    ALBUM: 'Album,SortName',
    DURATION: 'Runtime,AlbumArtist,Album,SortName',
    NAME: 'Name,SortName',
    RANDOM: 'Random,SortName',
    RECENTLY_ADDED: 'DateCreated,SortName',
    RELEASE_DATE: 'PremiereDate,AlbumArtist,Album,SortName',
} as const;

const albumArtistListParameters = paginationParameters.merge(
    baseParameters.extend({
        Filters: z.string().optional(),
        Genres: z.string().optional(),
        SortBy: z.nativeEnum(albumArtistListSort).optional(),
        Years: z.string().optional(),
    }),
);

const albumArtistList = pagination.extend({
    Items: z.array(albumArtist),
});

const similarArtistListParameters = baseParameters.extend({
    Limit: z.number().optional(),
});

const songListSort = {
    ALBUM: 'Album,SortName',
    ALBUM_ARTIST: 'AlbumArtist,Album,SortName',
    ALBUM_DETAIL: 'ParentIndexNumber,IndexNumber,SortName',
    ARTIST: 'Artist,Album,SortName',
    COMMUNITY_RATING: 'CommunityRating,SortName',
    DURATION: 'Runtime,AlbumArtist,Album,SortName',
    NAME: 'Name,SortName',
    PLAY_COUNT: 'PlayCount,SortName',
    RANDOM: 'Random,SortName',
    RECENTLY_ADDED: 'DateCreated,SortName',
    RECENTLY_PLAYED: 'DatePlayed,SortName',
    RELEASE_DATE: 'PremiereDate,AlbumArtist,Album,SortName',
} as const;

const songListParameters = paginationParameters.merge(
    baseParameters.extend({
        AlbumArtistIds: z.string().optional(),
        AlbumIds: z.string().optional(),
        ArtistIds: z.string().optional(),
        Filters: z.string().optional(),
        GenreIds: z.string().optional(),
        Genres: z.string().optional(),
        IsFavorite: z.boolean().optional(),
        SearchTerm: z.string().optional(),
        SortBy: z.nativeEnum(songListSort).optional(),
        Tags: z.string().optional(),
        Years: z.string().optional(),
    }),
);

const songList = pagination.extend({
    Items: z.array(song),
});

const playlistSongList = songList;

const topSongsList = songList;

const playlistDetailParameters = baseParameters.extend({
    Ids: z.string(),
});

const createPlaylistParameters = z.object({
    MediaType: z.literal('Audio'),
    Name: z.string(),
    Overview: z.string(),
    UserId: z.string(),
});

const createPlaylist = z.object({
    Id: z.string(),
});

const updatePlaylist = z.null();

const updatePlaylistParameters = z.object({
    Genres: z.array(genreItem),
    MediaType: z.literal('Audio'),
    Name: z.string(),
    Overview: z.string(),
    PremiereDate: z.null(),
    ProviderIds: z.object({}),
    Tags: z.array(genericItem),
    UserId: z.string(),
});

const addToPlaylist = z.object({
    Added: z.number(),
});

const addToPlaylistParameters = z.object({
    Ids: z.array(z.string()),
    UserId: z.string(),
});

const removeFromPlaylist = z.null();

const removeFromPlaylistParameters = z.object({
    EntryIds: z.array(z.string()),
});

const deletePlaylist = z.null();

const deletePlaylistParameters = z.object({
    Id: z.string(),
});

const scrobbleParameters = z.object({
    EventName: z.string().optional(),
    IsPaused: z.boolean().optional(),
    ItemId: z.string(),
    PlaylistItemId: z.string().optional(),
    PositionTicks: z.number().optional(),
});

const scrobble = z.any();

const favorite = z.object({
    IsFavorite: z.boolean(),
    ItemId: z.string(),
    Key: z.string(),
    LastPlayedDate: z.string(),
    Likes: z.boolean(),
    PlayCount: z.number(),
    PlaybackPositionTicks: z.number(),
    Played: z.boolean(),
    PlayedPercentage: z.number(),
    Rating: z.number(),
    UnplayedItemCount: z.number(),
});

const favoriteParameters = z.object({});

const searchParameters = paginationParameters.merge(baseParameters);

const search = z.any();

const lyricText = z.object({
    Start: z.number().optional(),
    Text: z.string(),
});

const lyrics = z.object({
    Lyrics: z.array(lyricText),
});

const queueItem = z.object({
    Id: z.string(),
    PlaylistItemId: z.string().optional(),
});

const queue = z.object({
    NowPlayingQueue: z.array(queueItem),
});

const saveQueueParameters = scrobbleParameters.merge(queue);

const getQueueParameters = z.object({
    DeviceId: z.string(),
});

const getSessions = z.array(
    sessionInfo.merge(
        z.object({
            PlaylistItemId: z.string().optional(),
        }),
    ),
);

export const jfType = {
    _enum: {
        albumArtistList: albumArtistListSort,
        albumList: albumListSort,
        collection: jfCollection,
        external: jfExternal,
        genreList: genreListSort,
        image: jfImage,
        playlistList: playlistListSort,
        songList: songListSort,
    },
    _parameters: {
        addToPlaylist: addToPlaylistParameters,
        albumArtistDetail: baseParameters,
        albumArtistList: albumArtistListParameters,
        albumDetail: albumDetailParameters,
        albumList: albumListParameters,
        authenticate: authenticateParameters,
        createPlaylist: createPlaylistParameters,
        deletePlaylist: deletePlaylistParameters,
        favorite: favoriteParameters,
        genreList: genreListParameters,
        getQueue: getQueueParameters,
        musicFolderList: musicFolderListParameters,
        playlistDetail: playlistDetailParameters,
        playlistList: playlistListParameters,
        removeFromPlaylist: removeFromPlaylistParameters,
        saveQueue: saveQueueParameters,
        scrobble: scrobbleParameters,
        search: searchParameters,
        similarArtistList: similarArtistListParameters,
        songList: songListParameters,
        updatePlaylist: updatePlaylistParameters,
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
        favorite,
        genre,
        genreList,
        getSessions,
        lyrics,
        musicFolderList,
        playlist,
        playlistList,
        playlistSongList,
        removeFromPlaylist,
        scrobble,
        search,
        song,
        songList,
        topSongsList,
        updatePlaylist,
        user,
    },
};
