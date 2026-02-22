import { ipcRenderer, IpcRendererEvent } from 'electron';

import {
    DlnaChangedTrack,
    DlnaDevice,
    DlnaInitialize,
    DlnaPositionInfo,
    DlnaQueue,
    DlnaQueueItem,
} from '/@/shared/types/types';

const discover = () => {
    return ipcRenderer.invoke('dlna-discover') as Promise<DlnaDevice[]>;
};

const initialize = (data: DlnaInitialize) => ipcRenderer.invoke('dlna-initialize', data);

const setQueue = (queue: DlnaQueue) => ipcRenderer.send('dlna-set-queue', queue);

const setQueueNext = (item: DlnaQueueItem) => ipcRenderer.send('dlna-set-queue-next', item);

const play = (speed?: number) => ipcRenderer.send('dlna-play', speed);

const pause = () => ipcRenderer.send('dlna-pause');

const stop = () => ipcRenderer.send('dlna-stop');

const getPositionInfo = () =>
    ipcRenderer.invoke('dlna-get-position-info') as Promise<DlnaPositionInfo>;

const seekTo = (seconds: number) => ipcRenderer.send('dlna-seek-to', seconds);

const setVolume = (value: number) => ipcRenderer.send('dlna-volume', value);

const setMute = (isMuted: boolean) => ipcRenderer.send('dlna-mute', isMuted);

const rendererDlnaChangedTrack = (
    cb: (event: IpcRendererEvent, data: DlnaChangedTrack) => void,
) => {
    ipcRenderer.on('renderer-dlna-changed-track', cb);
};

export const dlnaPlayer = {
    discover,
    getPositionInfo,
    initialize,
    pause,
    play,
    seekTo,
    setMute,
    setQueue,
    setQueueNext,
    setVolume,
    stop,
};

export const dlnaPlayerListener = {
    rendererDlnaChangedTrack,
};

export type DlnaPLayer = typeof dlnaPlayer;
export type DlnaPlayerListener = typeof dlnaPlayerListener;
