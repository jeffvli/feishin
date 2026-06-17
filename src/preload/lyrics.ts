import { ipcRenderer } from 'electron';

import {
    InternetProviderLyricSearchResponse,
    LyricGetQuery,
    LyricSearchQuery,
    LyricSource,
} from '../main/features/core/lyrics';

import { QueueSong } from '/@/shared/types/domain-types';

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

const convertFurigana = (text: string): Promise<string> => {
    return ipcRenderer.invoke('lyric-convert-furigana', text);
};

export const lyrics = {
    convertFurigana,
    getRemoteLyricsByRemoteId,
    getRemoteLyricsBySong,
    searchRemoteLyrics,
};

export type Lyrics = typeof lyrics;
