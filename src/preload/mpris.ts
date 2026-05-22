import { ipcRenderer } from 'electron';

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

const updateSong = (song: QueueSong | undefined, imageUrl?: null | string) => {
    ipcRenderer.send('update-song', song, imageUrl);
};

const requestSeek = (cb: (data: { offset: number }) => void) => {
    ipcRenderer.on('request-seek', (_, data) => cb(data));
};

const requestPosition = (cb: (data: { position: number }) => void) => {
    ipcRenderer.on('request-position', (_, data) => cb(data));
};

const requestToggleRepeat = (cb: (data: { repeat: PlayerRepeat }) => void) => {
    ipcRenderer.on('mpris-request-toggle-repeat', (_, data) => cb(data));
};

const requestToggleShuffle = (cb: (data: { shuffle: boolean }) => void) => {
    ipcRenderer.on('mpris-request-toggle-shuffle', (_, data) => cb(data));
};

const requestVolume = (cb: (data: { volume: number }) => void) => {
    ipcRenderer.on('request-volume', (_, data) => cb(data));
};

export const mpris = {
    requestPosition,
    requestSeek,
    requestToggleRepeat,
    requestToggleShuffle,
    requestVolume,
    updatePosition,
    updateRepeat,
    updateSeek,
    updateShuffle,
    updateSong,
    updateStatus,
    updateVolume,
};

export type Mpris = typeof mpris;
