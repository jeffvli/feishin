// Defines the volume limits shared by the main and renderer processes.
// The active maximum is resolved from these in the renderer, which owns the
// playback settings that determine it.

// The web-audio backend has no headroom above unity gain, so it stays at 100.
export const DEFAULT_VOLUME_MAX = 100;
// mpv's default --volume-max when the user passes nothing.
export const MPV_VOLUME_MAX_DEFAULT = 130;
// mpv's own hard ceiling for --volume-max.
export const MPV_VOLUME_MAX_CEILING = 1000;
