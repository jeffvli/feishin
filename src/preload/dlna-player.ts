import { ipcRenderer, IpcRendererEvent } from 'electron';

export interface DlnaDevice {
    controlUrl: string;
    id: string;
    location: string;
    name: string;
    renderingControlUrl: string;
}

export interface TrackMetadata {
    albumArtUrl?: string;
    albumName?: string;
    artistName?: string;
    duration?: number;
    mimeType?: string;
    title: string;
}

const discover = (): Promise<DlnaDevice[]> => {
    return ipcRenderer.invoke('dlna-discover');
};

const connect = (device: DlnaDevice): Promise<{ success: boolean; volume: number }> => {
    return ipcRenderer.invoke('dlna-connect', device);
};

const disconnect = (): Promise<boolean> => {
    return ipcRenderer.invoke('dlna-disconnect');
};

const playUrl = (url: string, metadata: TrackMetadata) => {
    ipcRenderer.send('dlna-play-url', { metadata, url });
};

const setNextUrl = (url: string, metadata: TrackMetadata) => {
    ipcRenderer.send('dlna-set-next-url', { metadata, url });
};

const play = () => {
    ipcRenderer.send('dlna-play');
};

const pause = () => {
    ipcRenderer.send('dlna-pause');
};

const stop = () => {
    ipcRenderer.send('dlna-stop');
};

const seek = (seconds: number) => {
    ipcRenderer.send('dlna-seek', seconds);
};

const volume = (value: number) => {
    ipcRenderer.send('dlna-volume', value);
};

const mute = (muted: boolean) => {
    ipcRenderer.send('dlna-mute', muted);
};

const getPosition = (): Promise<number> => {
    return ipcRenderer.invoke('dlna-get-position');
};

const rendererCurrentTime = (cb: (event: IpcRendererEvent, time: number) => void) => {
    ipcRenderer.on('renderer-dlna-current-time', cb);
};

const rendererTrackEnded = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-dlna-track-ended', cb);
};

export const dlnaPlayer = {
    connect,
    disconnect,
    discover,
    getPosition,
    mute,
    pause,
    play,
    playUrl,
    seek,
    setNextUrl,
    stop,
    volume,
};

export const dlnaPlayerListener = {
    rendererCurrentTime,
    rendererTrackEnded,
};

export type DlnaPlayer = typeof dlnaPlayer;
export type DlnaPlayerListener = typeof dlnaPlayerListener;
