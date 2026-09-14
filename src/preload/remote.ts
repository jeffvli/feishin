import { ipcRenderer } from 'electron';

import { QueueSong } from '/@/shared/types/domain-types';
import {
    RemoteAlbumItem,
    RemotePlaylistItem,
    RemoteQueueItem,
    RemoteRadioItem,
    RemoteTrackItem,
    ServerRadioStatus,
} from '/@/shared/types/remote-types';
import { Play, PlayerStatus } from '/@/shared/types/types';

interface RemoteListRequestPayload {
    limit?: number;
    requestId: string;
    searchTerm?: string;
    startIndex?: number;
}

const requestTracks = (cb: (data: RemoteListRequestPayload) => void) => {
    ipcRenderer.on('request-tracks', (_, data) => cb(data));
};

const requestAlbums = (cb: (data: RemoteListRequestPayload) => void) => {
    ipcRenderer.on('request-albums', (_, data) => cb(data));
};

const requestPlaylists = (cb: (data: RemoteListRequestPayload) => void) => {
    ipcRenderer.on('request-playlists', (_, data) => cb(data));
};

const requestRadio = (cb: (data: RemoteListRequestPayload) => void) => {
    ipcRenderer.on('request-radio', (_, data) => cb(data));
};

const requestClearQueue = (cb: (data: { requestId?: string }) => void) => {
    ipcRenderer.on('request-clear-queue', (_, data) => cb(data));
};

const requestPlayTrack = (
    cb: (data: { id: string; playType?: Play; requestId?: string }) => void,
) => {
    ipcRenderer.on('request-play-track', (_, data) => cb(data));
};

const requestPlayTrackRadio = (
    cb: (data: { id: string; playType: Play; requestId?: string }) => void,
) => {
    ipcRenderer.on('request-play-track-radio', (_, data) => cb(data));
};

const requestPlayAlbum = (
    cb: (data: { id: string; playType?: Play; requestId?: string }) => void,
) => {
    ipcRenderer.on('request-play-album', (_, data) => cb(data));
};

const requestPlayPlaylist = (
    cb: (data: { id: string; playType?: Play; requestId?: string }) => void,
) => {
    ipcRenderer.on('request-play-playlist', (_, data) => cb(data));
};

const requestPlayRadio = (cb: (data: { id: string }) => void) => {
    ipcRenderer.on('request-play-radio', (_, data) => cb(data));
};

const requestQueueJump = (cb: (data: { uniqueId: string }) => void) => {
    ipcRenderer.on('request-queue-jump', (_, data) => cb(data));
};

const requestAddToPlaylist = (
    cb: (data: { playlistId: string; requestId?: string; songId: string }) => void,
) => {
    ipcRenderer.on('request-add-to-playlist', (_, data) => cb(data));
};

const requestRemoveFromQueue = (cb: (data: { uniqueId: string }) => void) => {
    ipcRenderer.on('request-remove-from-queue', (_, data) => cb(data));
};

const requestReorderQueue = (
    cb: (data: { edge: 'bottom' | 'top'; targetUniqueId: string; uniqueId: string }) => void,
) => {
    ipcRenderer.on('request-reorder-queue', (_, data) => cb(data));
};

const respondTracks = (requestId: string, hasMore: boolean, items: RemoteTrackItem[]) => {
    ipcRenderer.send('respond-tracks', requestId, hasMore, items);
};

const respondAlbums = (requestId: string, hasMore: boolean, items: RemoteAlbumItem[]) => {
    ipcRenderer.send('respond-albums', requestId, hasMore, items);
};

const respondPlaylists = (requestId: string, hasMore: boolean, items: RemotePlaylistItem[]) => {
    ipcRenderer.send('respond-playlists', requestId, hasMore, items);
};

const respondRadio = (requestId: string, hasMore: boolean, items: RemoteRadioItem[]) => {
    ipcRenderer.send('respond-radio', requestId, hasMore, items);
};

const respondOperation = (requestId: string, error?: string) => {
    ipcRenderer.send('respond-operation', requestId, error);
};

const updateQueue = (currentUniqueId: null | string, items: RemoteQueueItem[]) => {
    ipcRenderer.send('update-queue', currentUniqueId, items);
};

const updateRadioStatus = (status: ServerRadioStatus['data']) => {
    ipcRenderer.send('update-radio-status', status);
};

const updateConfirmQueueChangesSetting = (enabled: boolean) => {
    ipcRenderer.send('update-confirm-queue-changes-setting', enabled);
};

const updateAccentColor = (color: { dark: string; light: string }) => {
    ipcRenderer.send('update-accent-color', color);
};

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
    requestAddToPlaylist,
    requestAlbums,
    requestClearQueue,
    requestFavorite,
    requestPlayAlbum,
    requestPlaylists,
    requestPlayPlaylist,
    requestPlayRadio,
    requestPlayTrack,
    requestPlayTrackRadio,
    requestPosition,
    requestQueueJump,
    requestRadio,
    requestRating,
    requestRemoveFromQueue,
    requestReorderQueue,
    requestSeek,
    requestTracks,
    requestVolume,
    respondAlbums,
    respondOperation,
    respondPlaylists,
    respondRadio,
    respondTracks,
    setRemoteEnabled,
    setRemotePort,
    updateAccentColor,
    updateConfirmQueueChangesSetting,
    updateFavorite,
    updatePassword,
    updatePlayback,
    updatePosition,
    updateQueue,
    updateRadioStatus,
    updateRating,
    updateRepeat,
    updateSetting,
    updateShuffle,
    updateSong,
    updateUsername,
    updateVolume,
};

export type Remote = typeof remote;
