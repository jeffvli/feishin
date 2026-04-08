// Should follow a strict naming convention: "<FEATURE GROUP>_<FEATURE NAME>"
// For example: <FEATURE GROUP>: "Playlists", <FEATURE NAME>: "Smart" = "PLAYLISTS_SMART"
export enum ServerFeature {
    ALBUM_YES_NO_RATING_FILTER = 'albumYesNoRatingFilter',
    ARTIST_IMAGE_UPLOAD = 'artistImageUpload',
    BFR = 'bfr',
    INTERNET_RADIO_IMAGE_UPLOAD = 'internetRadioImageUpload',
    LYRICS_MULTIPLE_STRUCTURED = 'lyricsMultipleStructured',
    LYRICS_SINGLE_STRUCTURED = 'lyricsSingleStructured',
    MUSIC_FOLDER_MULTISELECT = 'musicFolderMultiselect',
    OS_FORM_POST = 'osFormPost',
    OS_TRANSCODE_DECISION = 'osTranscodeDecision',
    PLAYLIST_IMAGE_UPLOAD = 'playlistImageUpload',
    PLAYLISTS_SMART = 'playlistsSmart',
    PUBLIC_PLAYLIST = 'publicPlaylist',
    SERVER_PLAY_QUEUE = 'serverPlayQueue',
    SHARING_ALBUM_SONG = 'sharingAlbumSong',
    SIMILAR_SONGS_MUSIC_FOLDER = 'similarSongsMusicFolder',
    TAGS = 'tags',
    TRACK_ALBUM_ARTIST_SEARCH = 'trackAlbumArtistSearch',
    TRACK_YES_NO_RATING_FILTER = 'trackYesNoRatingFilter',
}

export type ServerFeatures = Partial<Record<ServerFeature, number[]>>;
