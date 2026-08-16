export interface AudioPlayer {
    decreaseVolume(by: number): void;
    increaseVolume(by: number): void;
    pause(): void;
    play(): void;
    seekTo(seekTo: number): void;
    /**
     * Attenuate output by `multiplier` (0 = silent, 1 = the user's volume) without changing
     * transport state.
     *
     * This exists because pausing is not a private operation. On the mpv backend a pause makes
     * mpv emit `paused`, which arrives back as `renderer-player-pause` and is turned into
     * `mediaPause()`, writing `player.status` and so triggering a scrobble pause event, a
     * Discord RPC update, an MPRIS update and a visible play-button flip. Attenuating volume
     * touches none of that, and is idempotent, so a caller needs no "was it playing" snapshot.
     */
    setDuckLevel(multiplier: number): void;
    setVolume(volume: number): void;
}

export interface PlayerOnProgressProps {
    played: number;
    playedSeconds: number;
}
