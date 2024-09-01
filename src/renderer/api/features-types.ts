// Should follow a strict naming convention: "<FEATURE GROUP>_<FEATURE NAME>"
// For example: <FEATURE GROUP>: "Playlists", <FEATURE NAME>: "Smart" = "PLAYLISTS_SMART"
export enum ServerFeature {
    LYRICS_MULTIPLE_STRUCTURED = 'lyricsMultipleStructured',
    LYRICS_SINGLE_STRUCTURED = 'lyricsSingleStructured',
    PLAYLISTS_SMART = 'playlistsSmart',
    PUBLIC_PLAYLIST = 'publicPlaylist',
    SHARING_ALBUM_SONG = 'sharingAlbumSong',
}

export type ServerFeatures = Partial<Record<ServerFeature, boolean>>;
