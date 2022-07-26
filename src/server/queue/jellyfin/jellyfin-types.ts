export interface JFBaseResponse {
  StartIndex: number;
  TotalRecordCount: number;
}

export interface JFMusicFoldersResponse extends JFBaseResponse {
  Items: JFMusicFolder[];
}

export interface JFGenreResponse extends JFBaseResponse {
  Items: JFGenre[];
}

export interface JFAlbumArtistsResponse extends JFBaseResponse {
  Items: JFAlbumArtist[];
}

export interface JFArtistsResponse extends JFBaseResponse {
  Items: JFAlbumArtist[];
}

export interface JFAlbumsResponse extends JFBaseResponse {
  Items: JFAlbum[];
}

export interface JFSongsResponse extends JFBaseResponse {
  Items: JFSong[];
}

export interface JFRequestParams {
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
}

export interface JFMusicFolder {
  BackdropImageTags: any[];
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
}

export interface JFGenre {
  BackdropImageTags: any[];
  ChannelId: null;
  Id: string;
  ImageBlurHashes: any;
  ImageTags: any;
  LocationType: string;
  Name: string;
  ServerId: string;
  Type: string;
}

export interface JFAlbumArtist {
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
}

export interface JFArtist {
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
}

export interface JFAlbum {
  AlbumArtist: string;
  AlbumArtists: GenericItem[];
  ArtistItems: GenericItem[];
  Artists: string[];
  ChannelId: null;
  DateCreated: string;
  ExternalUrls: ExternalURL[];
  GenreItems: GenericItem[];
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
}

export interface JFSong {
  Album: string;
  AlbumArtist: string;
  AlbumArtists: GenericItem[];
  AlbumId: string;
  AlbumPrimaryImageTag: string;
  ArtistItems: GenericItem[];
  Artists: string[];
  BackdropImageTags: string[];
  ChannelId: null;
  DateCreated: string;
  ExternalUrls: ExternalURL[];
  GenreItems: GenericItem[];
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
  PremiereDate?: string;
  ProductionYear: number;
  RunTimeTicks: number;
  ServerId: string;
  Type: string;
}

interface ImageBlurHashes {
  Backdrop?: any;
  Logo?: any;
  Primary?: any;
}

interface ImageTags {
  Logo?: string;
  Primary?: string;
}

interface UserData {
  IsFavorite: boolean;
  Key: string;
  PlayCount: number;
  PlaybackPositionTicks: number;
  Played: boolean;
}

interface ExternalURL {
  Name: string;
  Url: string;
}

interface GenreItem {
  Id: string;
  Name: string;
}

interface GenericItem {
  Id: string;
  Name: string;
}

interface MediaSources {
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
}

interface MediaStream {
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
}
