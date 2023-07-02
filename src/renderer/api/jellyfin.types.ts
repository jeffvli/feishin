export type JFBasePaginatedResponse = {
    StartIndex: number;
    TotalRecordCount: number;
};

export interface JFMusicFolderListResponse extends JFBasePaginatedResponse {
    Items: JFMusicFolder[];
}

export type JFMusicFolderList = JFMusicFolder[];

export interface JFGenreListResponse extends JFBasePaginatedResponse {
    Items: JFGenre[];
}

export type JFGenreList = JFGenreListResponse;

export type JFAlbumArtistDetailResponse = JFAlbumArtist;

export type JFAlbumArtistDetail = JFAlbumArtistDetailResponse;

export interface JFAlbumArtistListResponse extends JFBasePaginatedResponse {
    Items: JFAlbumArtist[];
}

export type JFAlbumArtistList = {
    items: JFAlbumArtist[];
    startIndex: number;
    totalRecordCount: number;
};

export interface JFArtistListResponse extends JFBasePaginatedResponse {
    Items: JFAlbumArtist[];
}

export type JFArtistList = JFArtistListResponse;

export interface JFAlbumListResponse extends JFBasePaginatedResponse {
    Items: JFAlbum[];
}

export type JFAlbumList = {
    items: JFAlbum[];
    startIndex: number;
    totalRecordCount: number;
};

export type JFAlbumDetailResponse = JFAlbum;

export type JFAlbumDetail = JFAlbum & { songs?: JFSong[] };

export interface JFSongListResponse extends JFBasePaginatedResponse {
    Items: JFSong[];
}

export type JFSongList = {
    items: JFSong[];
    startIndex: number;
    totalRecordCount: number;
};

export type JFAddToPlaylistResponse = {
    added: number;
};

export type JFAddToPlaylistParams = {
    ids: string[];
    userId: string;
};

export type JFAddToPlaylist = null;

export type JFRemoveFromPlaylistResponse = null;

export type JFRemoveFromPlaylistParams = {
    entryIds: string[];
};

export type JFRemoveFromPlaylist = null;

export interface JFPlaylistListResponse extends JFBasePaginatedResponse {
    Items: JFPlaylist[];
}

export type JFPlaylistList = {
    items: JFPlaylist[];
    startIndex: number;
    totalRecordCount: number;
};

export enum JFPlaylistListSort {
    ALBUM_ARTIST = 'AlbumArtist,SortName',
    DURATION = 'Runtime',
    NAME = 'SortName',
    RECENTLY_ADDED = 'DateCreated,SortName',
    SONG_COUNT = 'ChildCount',
}

export type JFPlaylistDetailResponse = JFPlaylist;

export type JFPlaylistDetail = JFPlaylist & { songs?: JFSong[] };

export type JFPlaylist = {
    BackdropImageTags: string[];
    ChannelId: null;
    ChildCount?: number;
    DateCreated: string;
    GenreItems: GenreItem[];
    Genres: string[];
    Id: string;
    ImageBlurHashes: ImageBlurHashes;
    ImageTags: ImageTags;
    IsFolder: boolean;
    LocationType: string;
    MediaType: string;
    Name: string;
    Overview?: string;
    RunTimeTicks: number;
    ServerId: string;
    Type: string;
    UserData: UserData;
};

export type JFRequestParams = {
    albumArtistIds?: string;
    artistIds?: string;
    enableImageTypes?: string;
    enableTotalRecordCount?: boolean;
    enableUserData?: boolean;
    excludeItemTypes?: string;
    fields?: string;
    imageTypeLimit?: number;
    includeItemTypes?: string;
    isFavorite?: boolean;
    limit?: number;
    parentId?: string;
    recursive?: boolean;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    startIndex?: number;
    userId?: string;
};

export type JFMusicFolder = {
    BackdropImageTags: string[];
    ChannelId: null;
    CollectionType: string;
    Id: string;
    ImageBlurHashes: ImageBlurHashes;
    ImageTags: ImageTags;
    IsFolder: boolean;
    LocationType: string;
    Name: string;
    ServerId: string;
    Type: string;
    UserData: UserData;
};

export type JFGenre = {
    BackdropImageTags: any[];
    ChannelId: null;
    Id: string;
    ImageBlurHashes: any;
    ImageTags: ImageTags;
    LocationType: string;
    Name: string;
    ServerId: string;
    Type: string;
};

export type JFAlbumArtist = {
    BackdropImageTags: string[];
    ChannelId: null;
    DateCreated: string;
    ExternalUrls: ExternalURL[];
    GenreItems: GenreItem[];
    Genres: string[];
    Id: string;
    ImageBlurHashes: any;
    ImageTags: ImageTags;
    LocationType: string;
    Name: string;
    Overview?: string;
    RunTimeTicks: number;
    ServerId: string;
    Type: string;
    UserData: {
        IsFavorite: boolean;
        Key: string;
        PlayCount: number;
        PlaybackPositionTicks: number;
        Played: boolean;
    };
} & {
    similarArtists: {
        items: JFAlbumArtist[];
    };
};

export type JFArtist = {
    BackdropImageTags: string[];
    ChannelId: null;
    DateCreated: string;
    ExternalUrls: ExternalURL[];
    GenreItems: GenreItem[];
    Genres: string[];
    Id: string;
    ImageBlurHashes: any;
    ImageTags: string[];
    LocationType: string;
    Name: string;
    Overview?: string;
    RunTimeTicks: number;
    ServerId: string;
    Type: string;
};

export type JFAlbum = {
    AlbumArtist: string;
    AlbumArtists: JFGenericItem[];
    AlbumPrimaryImageTag: string;
    ArtistItems: JFGenericItem[];
    Artists: string[];
    ChannelId: null;
    ChildCount?: number;
    DateCreated: string;
    DateLastMediaAdded?: string;
    ExternalUrls: ExternalURL[];
    GenreItems: JFGenericItem[];
    Genres: string[];
    Id: string;
    ImageBlurHashes: ImageBlurHashes;
    ImageTags: ImageTags;
    IsFolder: boolean;
    LocationType: string;
    Name: string;
    ParentLogoImageTag: string;
    ParentLogoItemId: string;
    PremiereDate?: string;
    ProductionYear: number;
    RunTimeTicks: number;
    ServerId: string;
    Type: string;
    UserData?: UserData;
} & {
    songs?: JFSong[];
};

export type JFSong = {
    Album: string;
    AlbumArtist: string;
    AlbumArtists: JFGenericItem[];
    AlbumId: string;
    AlbumPrimaryImageTag: string;
    ArtistItems: JFGenericItem[];
    Artists: string[];
    BackdropImageTags: string[];
    ChannelId: null;
    DateCreated: string;
    ExternalUrls: ExternalURL[];
    GenreItems: JFGenericItem[];
    Genres: string[];
    Id: string;
    ImageBlurHashes: ImageBlurHashes;
    ImageTags: ImageTags;
    IndexNumber: number;
    IsFolder: boolean;
    LocationType: string;
    MediaSources: MediaSources[];
    MediaType: string;
    Name: string;
    ParentIndexNumber: number;
    PlaylistItemId?: string;
    PremiereDate?: string;
    ProductionYear: number;
    RunTimeTicks: number;
    ServerId: string;
    SortName: string;
    Type: string;
    UserData?: UserData;
};

type ImageBlurHashes = {
    Backdrop?: any;
    Logo?: any;
    Primary?: any;
};

type ImageTags = {
    Logo?: string;
    Primary?: string;
};

type UserData = {
    IsFavorite: boolean;
    Key: string;
    PlayCount: number;
    PlaybackPositionTicks: number;
    Played: boolean;
};

type ExternalURL = {
    Name: string;
    Url: string;
};

type GenreItem = {
    Id: string;
    Name: string;
};

export type JFGenericItem = {
    Id: string;
    Name: string;
};

type MediaSources = {
    Bitrate: number;
    Container: string;
    DefaultAudioStreamIndex: number;
    ETag: string;
    Formats: any[];
    GenPtsInput: boolean;
    Id: string;
    IgnoreDts: boolean;
    IgnoreIndex: boolean;
    IsInfiniteStream: boolean;
    IsRemote: boolean;
    MediaAttachments: any[];
    MediaStreams: MediaStream[];
    Name: string;
    Path: string;
    Protocol: string;
    ReadAtNativeFramerate: boolean;
    RequiredHttpHeaders: any;
    RequiresClosing: boolean;
    RequiresLooping: boolean;
    RequiresOpening: boolean;
    RunTimeTicks: number;
    Size: number;
    SupportsDirectPlay: boolean;
    SupportsDirectStream: boolean;
    SupportsProbing: boolean;
    SupportsTranscoding: boolean;
    Type: string;
};

type MediaStream = {
    AspectRatio?: string;
    BitDepth?: number;
    BitRate?: number;
    ChannelLayout?: string;
    Channels?: number;
    Codec: string;
    CodecTimeBase: string;
    ColorSpace?: string;
    Comment?: string;
    DisplayTitle?: string;
    Height?: number;
    Index: number;
    IsDefault: boolean;
    IsExternal: boolean;
    IsForced: boolean;
    IsInterlaced: boolean;
    IsTextSubtitleStream: boolean;
    Level: number;
    PixelFormat?: string;
    Profile?: string;
    RealFrameRate?: number;
    RefFrames?: number;
    SampleRate?: number;
    SupportsExternalStream: boolean;
    TimeBase: string;
    Type: string;
    Width?: number;
};

export enum JFExternalType {
    MUSICBRAINZ = 'MusicBrainz',
    THEAUDIODB = 'TheAudioDb',
}

export enum JFImageType {
    LOGO = 'Logo',
    PRIMARY = 'Primary',
}

export enum JFItemType {
    AUDIO = 'Audio',
    MUSICALBUM = 'MusicAlbum',
}

export enum JFCollectionType {
    MUSIC = 'music',
    PLAYLISTS = 'playlists',
}

export interface JFAuthenticate {
    AccessToken: string;
    ServerId: string;
    SessionInfo: SessionInfo;
    User: User;
}

type SessionInfo = {
    AdditionalUsers: any[];
    ApplicationVersion: string;
    Capabilities: Capabilities;
    Client: string;
    DeviceId: string;
    DeviceName: string;
    HasCustomDeviceName: boolean;
    Id: string;
    IsActive: boolean;
    LastActivityDate: string;
    LastPlaybackCheckIn: string;
    NowPlayingQueue: any[];
    NowPlayingQueueFullItems: any[];
    PlayState: PlayState;
    PlayableMediaTypes: any[];
    RemoteEndPoint: string;
    ServerId: string;
    SupportedCommands: any[];
    SupportsMediaControl: boolean;
    SupportsRemoteControl: boolean;
    UserId: string;
    UserName: string;
};

type Capabilities = {
    PlayableMediaTypes: any[];
    SupportedCommands: any[];
    SupportsContentUploading: boolean;
    SupportsMediaControl: boolean;
    SupportsPersistentIdentifier: boolean;
    SupportsSync: boolean;
};

type PlayState = {
    CanSeek: boolean;
    IsMuted: boolean;
    IsPaused: boolean;
    RepeatMode: string;
};

type User = {
    Configuration: Configuration;
    EnableAutoLogin: boolean;
    HasConfiguredEasyPassword: boolean;
    HasConfiguredPassword: boolean;
    HasPassword: boolean;
    Id: string;
    LastActivityDate: string;
    LastLoginDate: string;
    Name: string;
    Policy: Policy;
    ServerId: string;
};

type Configuration = {
    DisplayCollectionsView: boolean;
    DisplayMissingEpisodes: boolean;
    EnableLocalPassword: boolean;
    EnableNextEpisodeAutoPlay: boolean;
    GroupedFolders: any[];
    HidePlayedInLatest: boolean;
    LatestItemsExcludes: any[];
    MyMediaExcludes: any[];
    OrderedViews: any[];
    PlayDefaultAudioTrack: boolean;
    RememberAudioSelections: boolean;
    RememberSubtitleSelections: boolean;
    SubtitleLanguagePreference: string;
    SubtitleMode: string;
};

type Policy = {
    AccessSchedules: any[];
    AuthenticationProviderId: string;
    BlockUnratedItems: any[];
    BlockedChannels: any[];
    BlockedMediaFolders: any[];
    BlockedTags: any[];
    EnableAllChannels: boolean;
    EnableAllDevices: boolean;
    EnableAllFolders: boolean;
    EnableAudioPlaybackTranscoding: boolean;
    EnableContentDeletion: boolean;
    EnableContentDeletionFromFolders: any[];
    EnableContentDownloading: boolean;
    EnableLiveTvAccess: boolean;
    EnableLiveTvManagement: boolean;
    EnableMediaConversion: boolean;
    EnableMediaPlayback: boolean;
    EnablePlaybackRemuxing: boolean;
    EnablePublicSharing: boolean;
    EnableRemoteAccess: boolean;
    EnableRemoteControlOfOtherUsers: boolean;
    EnableSharedDeviceControl: boolean;
    EnableSyncTranscoding: boolean;
    EnableUserPreferenceAccess: boolean;
    EnableVideoPlaybackTranscoding: boolean;
    EnabledChannels: any[];
    EnabledDevices: any[];
    EnabledFolders: any[];
    ForceRemoteSourceTranscoding: boolean;
    InvalidLoginAttemptCount: number;
    IsAdministrator: boolean;
    IsDisabled: boolean;
    IsHidden: boolean;
    LoginAttemptsBeforeLockout: number;
    MaxActiveSessions: number;
    PasswordResetProviderId: string;
    RemoteClientBitrateLimit: number;
    SyncPlayAccess: string;
};

type JFBaseParams = {
    enableImageTypes?: JFImageType[];
    fields?: string;
    imageTypeLimit?: number;
    parentId?: string;
    recursive?: boolean;
    searchTerm?: string;
    userId?: string;
};

type JFPaginationParams = {
    limit?: number;
    nameStartsWith?: string;
    sortOrder?: JFSortOrder;
    startIndex?: number;
};

export enum JFSortOrder {
    ASC = 'Ascending',
    DESC = 'Descending',
}

export enum JFAlbumListSort {
    ALBUM_ARTIST = 'AlbumArtist,SortName',
    COMMUNITY_RATING = 'CommunityRating,SortName',
    CRITIC_RATING = 'CriticRating,SortName',
    NAME = 'SortName',
    RANDOM = 'Random,SortName',
    RECENTLY_ADDED = 'DateCreated,SortName',
    RELEASE_DATE = 'ProductionYear,PremiereDate,SortName',
}

export type JFAlbumListParams = {
    albumArtistIds?: string;
    artistIds?: string;
    filters?: string;
    genreIds?: string;
    genres?: string;
    includeItemTypes: 'MusicAlbum';
    isFavorite?: boolean;
    searchTerm?: string;
    sortBy?: JFAlbumListSort;
    tags?: string;
    years?: string;
} & JFBaseParams &
    JFPaginationParams;

export enum JFSongListSort {
    ALBUM = 'Album,SortName',
    ALBUM_ARTIST = 'AlbumArtist,Album,SortName',
    ARTIST = 'Artist,Album,SortName',
    COMMUNITY_RATING = 'CommunityRating,SortName',
    DURATION = 'Runtime,AlbumArtist,Album,SortName',
    NAME = 'Name,SortName',
    PLAY_COUNT = 'PlayCount,SortName',
    RANDOM = 'Random,SortName',
    RECENTLY_ADDED = 'DateCreated,SortName',
    RECENTLY_PLAYED = 'DatePlayed,SortName',
    RELEASE_DATE = 'PremiereDate,AlbumArtist,Album,SortName',
}

export type JFSongListParams = {
    albumArtistIds?: string;
    albumIds?: string;
    artistIds?: string;
    contributingArtistIds?: string;
    filters?: string;
    genreIds?: string;
    genres?: string;
    ids?: string;
    includeItemTypes: 'Audio';
    searchTerm?: string;
    sortBy?: JFSongListSort;
    years?: string;
} & JFBaseParams &
    JFPaginationParams;

export enum JFAlbumArtistListSort {
    ALBUM = 'Album,SortName',
    DURATION = 'Runtime,AlbumArtist,Album,SortName',
    NAME = 'Name,SortName',
    RANDOM = 'Random,SortName',
    RECENTLY_ADDED = 'DateCreated,SortName',
    RELEASE_DATE = 'PremiereDate,AlbumArtist,Album,SortName',
}

export type JFAlbumArtistListParams = {
    filters?: string;
    genres?: string;
    sortBy?: JFAlbumArtistListSort;
    years?: string;
} & JFBaseParams &
    JFPaginationParams;

export enum JFArtistListSort {
    ALBUM = 'Album,SortName',
    DURATION = 'Runtime,AlbumArtist,Album,SortName',
    NAME = 'Name,SortName',
    RANDOM = 'Random,SortName',
    RECENTLY_ADDED = 'DateCreated,SortName',
    RELEASE_DATE = 'PremiereDate,AlbumArtist,Album,SortName',
}

export type JFArtistListParams = {
    filters?: string;
    genres?: string;
    sortBy?: JFArtistListSort;
    years?: string;
} & JFBaseParams &
    JFPaginationParams;

export type JFCreatePlaylistResponse = {
    Id: string;
};

export type JFCreatePlaylist = JFCreatePlaylistResponse;
