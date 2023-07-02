import { ipcRenderer } from 'electron';
import { LyricSearchQuery, QueueSong } from '/@/renderer/api/types';

const getRemoteLyricsBySong = (song: QueueSong) => {
    const result = ipcRenderer.invoke('lyric-by-song', song);
    return result;
};

const searchRemoteLyrics = (params: LyricSearchQuery) => {
    const result = ipcRenderer.invoke('lyric-search', params);
    return result;
};

const getRemoteLyricsByRemoteId = (id: string) => {
    const result = ipcRenderer.invoke('lyric-by-remote-id', id);
    return result;
};

export const lyrics = {
    getRemoteLyricsByRemoteId,
    getRemoteLyricsBySong,
    searchRemoteLyrics,
};
