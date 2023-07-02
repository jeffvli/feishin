import { IpcRendererEvent, ipcRenderer } from 'electron';
import type { PlayerRepeat } from '/@/renderer/types';

const updatePosition = (timeSec: number) => {
    ipcRenderer.send('mpris-update-position', timeSec);
};

const updateSeek = (timeSec: number) => {
    ipcRenderer.send('mpris-update-seek', timeSec);
};

const toggleRepeat = () => {
    ipcRenderer.send('mpris-toggle-repeat');
};

const toggleShuffle = () => {
    ipcRenderer.send('mpris-toggle-shuffle');
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
    requestToggleRepeat,
    requestToggleShuffle,
    toggleRepeat,
    toggleShuffle,
    updatePosition,
    updateSeek,
};

export type Mpris = typeof mpris;
