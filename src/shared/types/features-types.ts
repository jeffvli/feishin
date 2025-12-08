// Should follow a strict naming convention: "<FEATURE GROUP>_<FEATURE NAME>"
// For example: <FEATURE GROUP>: "Playlists", <FEATURE NAME>: "Smart" = "PLAYLISTS_SMART"
export enum ServerFeature {
    BFR = 'bfr',
    LYRICS_MULTIPLE_STRUCTURED = 'lyricsMultipleStructured',
    LYRICS_SINGLE_STRUCTURED = 'lyricsSingleStructured',
    MUSIC_FOLDER_MULTISELECT = 'musicFolderMultiselect',
    OS_FORM_POST = 'osFormPost',
    PLAYLISTS_SMART = 'playlistsSmart',
    PUBLIC_PLAYLIST = 'publicPlaylist',
    SERVER_PLAY_QUEUE = 'serverPlayQueue',
    SHARING_ALBUM_SONG = 'sharingAlbumSong',
    TAGS = 'tags',
    TRACK_ALBUM_ARTIST_SEARCH = 'trackAlbumArtistSearch',
}

export type ServerFeatures = Partial<Record<ServerFeature, number[]>>;
