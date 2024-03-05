export enum ServerFeature {
    MULTIPLE_STRUCTURED_LYRICS = 'multipleStructuredLyrics',
    SINGLE_STRUCTURED_LYRIC = 'singleStructuredLyric',
    SMART_PLAYLISTS = 'smartPlaylists',
}

export type ServerFeatures = Partial<Record<ServerFeature, boolean>>;
