import { ipcRenderer } from 'electron';

import { PlayerData } from '/@/shared/types/domain-types';

const initialize = (data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
    return ipcRenderer.invoke('player-initialize', data);
};

const restart = (data: {
    binaryPath?: string;
    extraParameters?: string[];
    properties?: Record<string, any>;
}) => {
    return ipcRenderer.invoke('player-restart', data);
};

const isRunning = () => {
    return ipcRenderer.invoke('player-is-running');
};

const cleanup = () => {
    return ipcRenderer.invoke('player-clean-up');
};

const setProperties = (data: Record<string, any>) => {
    ipcRenderer.send('player-set-properties', data);
};

const autoNext = (url?: string) => {
    ipcRenderer.send('player-auto-next', url);
};

const currentTime = () => {
    ipcRenderer.send('player-current-time');
};

const mute = (mute: boolean) => {
    ipcRenderer.send('player-mute', mute);
};

const next = () => {
    ipcRenderer.send('player-next');
};

const pause = () => {
    ipcRenderer.send('player-pause');
};

const play = () => {
    ipcRenderer.send('player-play');
};

const previous = () => {
    ipcRenderer.send('player-previous');
};

const seek = (seconds: number) => {
    ipcRenderer.send('player-seek', seconds);
};

const seekTo = (seconds: number) => {
    ipcRenderer.send('player-seek-to', seconds);
};

const setQueue = (current?: string, next?: string, pause?: boolean) => {
    ipcRenderer.send('player-set-queue', current, next, pause);
};

const setQueueNext = (url?: string) => {
    ipcRenderer.send('player-set-queue-next', url);
};

const stop = () => {
    ipcRenderer.send('player-stop');
};

const volume = (value: number) => {
    ipcRenderer.send('player-volume', value);
};

const quit = () => {
    ipcRenderer.send('player-quit');
};

const getCurrentTime = async () => {
    return ipcRenderer.invoke('player-get-time');
};

const updateMetadata = (data: PlayerData) => {
    ipcRenderer.send('player-update-metadata', data);
};

const getMetadata = async () => {
    return ipcRenderer.invoke('player-metadata');
};

const getStreamMetadata = async () => {
    return ipcRenderer.invoke('player-stream-metadata');
};

const getAudioDevices = async () => {
    return ipcRenderer.invoke('player-get-audio-devices');
};

const rendererAutoNext = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-auto-next', (_, data) => cb(data));
};

const rendererCurrentTime = (cb: (data: number) => void) => {
    ipcRenderer.on('renderer-player-current-time', (_, data) => cb(data));
};

const rendererNext = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-next', (_, data) => cb(data));
};

const rendererPause = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-pause', (_, data) => cb(data));
};

const rendererPlay = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-play', (_, data) => cb(data));
};

const rendererPlayPause = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-play-pause', (_, data) => cb(data));
};

const rendererPrevious = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-previous', (_, data) => cb(data));
};

const rendererStop = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-stop', (_, data) => cb(data));
};

const rendererSkipForward = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-skip-forward', (_, data) => cb(data));
};

const rendererSkipBackward = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-skip-backward', (_, data) => cb(data));
};

const rendererVolumeUp = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-volume-up', (_, data) => cb(data));
};

const rendererVolumeDown = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-volume-down', (_, data) => cb(data));
};

const rendererVolumeMute = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-volume-mute', (_, data) => cb(data));
};

const rendererToggleRepeat = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-toggle-repeat', (_, data) => cb(data));
};

const rendererToggleShuffle = (cb: (data: PlayerData) => void) => {
    ipcRenderer.on('renderer-player-toggle-shuffle', (_, data) => cb(data));
};

const rendererQuit = (cb: () => void) => {
    ipcRenderer.on('renderer-player-quit', () => cb());
};

const rendererError = (cb: (data: string) => void) => {
    ipcRenderer.on('renderer-player-error', (_, data) => cb(data));
};

const rendererPlayerFallback = (cb: (data: boolean) => void) => {
    ipcRenderer.on('renderer-player-fallback', (_, data) => cb(data));
};

export const mpvPlayer = {
    autoNext,
    cleanup,
    currentTime,
    getAudioDevices,
    getCurrentTime,
    getMetadata,
    getStreamMetadata,
    initialize,
    isRunning,
    mute,
    next,
    pause,
    play,
    previous,
    quit,
    restart,
    seek,
    seekTo,
    setProperties,
    setQueue,
    setQueueNext,
    stop,
    updateMetadata,
    volume,
};

export const mpvPlayerListener = {
    rendererAutoNext,
    rendererCurrentTime,
    rendererError,
    rendererNext,
    rendererPause,
    rendererPlay,
    rendererPlayerFallback,
    rendererPlayPause,
    rendererPrevious,
    rendererQuit,
    rendererSkipBackward,
    rendererSkipForward,
    rendererStop,
    rendererToggleRepeat,
    rendererToggleShuffle,
    rendererVolumeDown,
    rendererVolumeMute,
    rendererVolumeUp,
};

export type MpvPLayer = typeof mpvPlayer;
export type MpvPlayerListener = typeof mpvPlayerListener;
