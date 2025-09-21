// Defines the selectors used to identify playback-related elements in the UI.
// Can be used by browser extensions for accessing meta data around currently playing media.

export const PlaybackSelectors = {
    elapsedTime: 'elapsed-time',
    mediaPlayer: 'media-player',
    playerCoverArt: 'player-cover-art',
    playerStatePaused: 'player-state-paused',
    playerStatePlaying: 'player-state-playing',
    songAlbum: 'song-album',
    songArtist: 'song-artist',
    songTitle: 'song-title',
    totalDuration: 'total-duration',
} as const;
