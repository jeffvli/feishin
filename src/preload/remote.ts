import { ipcRenderer } from 'electron';

import { QueueSong } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const requestFavorite = (
    cb: (data: { favorite: boolean; id: string; serverId: string }) => void,
) => {
    ipcRenderer.on('request-favorite', (_, data) => cb(data));
};

const requestPosition = (cb: (data: { position: number }) => void) => {
    ipcRenderer.on('request-position', (_, data) => cb(data));
};

const requestRating = (cb: (data: { id: string; rating: number; serverId: string }) => void) => {
    ipcRenderer.on('request-rating', (_, data) => cb(data));
};

const requestSeek = (cb: (data: { offset: number }) => void) => {
    ipcRenderer.on('request-seek', (_, data) => cb(data));
};

const requestVolume = (cb: (data: { volume: number }) => void) => {
    ipcRenderer.on('request-volume', (_, data) => cb(data));
};

const setRemoteEnabled = (enabled: boolean): Promise<null | string> => {
    const result = ipcRenderer.invoke('remote-enable', enabled);
    return result;
};

const setRemotePort = (port: number): Promise<null | string> => {
    const result = ipcRenderer.invoke('remote-port', port);
    return result;
};

const updateFavorite = (favorite: boolean, serverId: string, ids: string[]) => {
    ipcRenderer.send('update-favorite', favorite, serverId, ids);
};

const updatePassword = (password: string) => {
    ipcRenderer.send('remote-password', password);
};

const updatePlayback = (playback: PlayerStatus) => {
    ipcRenderer.send('update-playback', playback);
};

const updateSetting = (
    enabled: boolean,
    port: number,
    username: string,
    password: string,
): Promise<null | string> => {
    return ipcRenderer.invoke('remote-settings', enabled, port, username, password);
};

const updateRating = (rating: number, serverId: string, ids: string[]) => {
    ipcRenderer.send('update-rating', rating, serverId, ids);
};

const updateRepeat = (repeat: string) => {
    ipcRenderer.send('update-repeat', repeat);
};

const updateShuffle = (shuffle: boolean) => {
    ipcRenderer.send('update-shuffle', shuffle);
};

const updateSong = (song: QueueSong | undefined, imageUrl?: null | string) => {
    ipcRenderer.send('update-song', song, imageUrl);
};

const updateUsername = (username: string) => {
    ipcRenderer.send('remote-username', username);
};

const updateVolume = (volume: number) => {
    ipcRenderer.send('update-volume', volume);
};

const updatePosition = (timeSec: number) => {
    ipcRenderer.send('update-position', timeSec);
};

export const remote = {
    requestFavorite,
    requestPosition,
    requestRating,
    requestSeek,
    requestVolume,
    setRemoteEnabled,
    setRemotePort,
    updateFavorite,
    updatePassword,
    updatePlayback,
    updatePosition,
    updateRating,
    updateRepeat,
    updateSetting,
    updateShuffle,
    updateSong,
    updateUsername,
    updateVolume,
};

export type Remote = typeof remote;
