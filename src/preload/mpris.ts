import { ipcRenderer, IpcRendererEvent } from 'electron';

import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerStatus } from '/@/shared/types/types';

const updatePosition = (timeSec: number) => {
    ipcRenderer.send('update-position', timeSec);
};

const updateSeek = (timeSec: number) => {
    ipcRenderer.send('update-seek', timeSec);
};

const updateVolume = (volume: number) => {
    ipcRenderer.send('update-volume', volume);
};

const updateStatus = (status: PlayerStatus) => {
    ipcRenderer.send('update-playback', status);
};

const updateRepeat = (repeat: PlayerRepeat) => {
    ipcRenderer.send('update-repeat', repeat);
};

const updateShuffle = (shuffle: boolean) => {
    ipcRenderer.send('update-shuffle', shuffle);
};

const updateSong = (song: QueueSong | undefined) => {
    ipcRenderer.send('update-song', song);
};

const requestSeek = (cb: (event: IpcRendererEvent, data: { offset: number }) => void) => {
    ipcRenderer.on('request-seek', cb);
};

const requestPosition = (cb: (event: IpcRendererEvent, data: { position: number }) => void) => {
    ipcRenderer.on('request-position', cb);
};

const requestToggleRepeat = (
    cb: (event: IpcRendererEvent, data: { repeat: PlayerRepeat }) => void,
) => {
    ipcRenderer.on('mpris-request-toggle-repeat', cb);
};

const requestToggleShuffle = (
    cb: (event: IpcRendererEvent, data: { shuffle: boolean }) => void,
) => {
    ipcRenderer.on('mpris-request-toggle-shuffle', cb);
};

export const mpris = {
    requestPosition,
    requestSeek,
    requestToggleRepeat,
    requestToggleShuffle,
    updatePosition,
    updateRepeat,
    updateSeek,
    updateShuffle,
    updateSong,
    updateStatus,
    updateVolume,
};

export type Mpris = typeof mpris;
