import { ipcRenderer } from 'electron';

const discover = () => {
    return ipcRenderer.invoke('sonos:discover');
};

const connect = (deviceId: string, groupId?: string) => {
    return ipcRenderer.invoke('sonos:connect', deviceId, groupId);
};

const disconnect = () => {
    return ipcRenderer.invoke('sonos:disconnect');
};

const getConnectionStatus = () => {
    return ipcRenderer.invoke('sonos:get-connection-status');
};

const getPlaybackStatus = () => {
    return ipcRenderer.invoke('sonos:get-playback-status');
};

const logToTerminal = (msg: string) => {
    return ipcRenderer.invoke('sonos:log', msg);
};

const loadTrack = (streamUrl: string, metadata?: any) => {
    return ipcRenderer.invoke('sonos:load-track', streamUrl, metadata);
};

const play = () => {
    return ipcRenderer.invoke('sonos:play');
};

const pause = () => {
    return ipcRenderer.invoke('sonos:pause');
};

const stop = () => {
    return ipcRenderer.invoke('sonos:stop');
};

const seek = (positionMillis: number) => {
    return ipcRenderer.invoke('sonos:seek', positionMillis);
};

const skipNext = () => {
    return ipcRenderer.invoke('sonos:skip-next');
};

const skipPrev = () => {
    return ipcRenderer.invoke('sonos:skip-prev');
};

const setVolume = (volume: number) => {
    return ipcRenderer.invoke('sonos:set-volume', volume);
};

export const sonos = {
    connect,
    disconnect,
    discover,
    getConnectionStatus,
    getPlaybackStatus,
    loadTrack,
    logToTerminal,
    pause,
    play,
    seek,
    setVolume,
    skipNext,
    skipPrev,
    stop,
};
