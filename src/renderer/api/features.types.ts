export enum ServerFeature {
    SMART_PLAYLISTS = 'smartPlaylists',
    SONG_LYRICS = 'songLyrics',
}

export type ServerFeatures = Record<Partial<ServerFeature>, boolean>;
