import { ipcRenderer } from 'electron';
import {
    InternetProviderLyricSearchResponse,
    LyricGetQuery,
    LyricSearchQuery,
    LyricSource,
    QueueSong,
} from '/@/renderer/api/types';

const getRemoteLyricsBySong = (song: QueueSong) => {
    const result = ipcRenderer.invoke('lyric-by-song', song);
    return result;
};

const searchRemoteLyrics = (
    params: LyricSearchQuery,
): Promise<Record<LyricSource, InternetProviderLyricSearchResponse[]>> => {
    const result = ipcRenderer.invoke('lyric-search', params);
    return result;
};

const getRemoteLyricsByRemoteId = (id: LyricGetQuery) => {
    const result = ipcRenderer.invoke('lyric-by-remote-id', id);
    return result;
};

export const lyrics = {
    getRemoteLyricsByRemoteId,
    getRemoteLyricsBySong,
    searchRemoteLyrics,
};

export type Lyrics = typeof lyrics;
