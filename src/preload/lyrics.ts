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

const convertFuriganaFragment = (text: string): Promise<string> => {
    return ipcRenderer.invoke('lyric-convert-furigana-fragment', text);
};

const parseLyricsTextTokens = (text: string) => {
    return ipcRenderer.invoke('lyric-parse-text-tokens', text);
};

const convertRomaji = (text: string): Promise<string> => {
    return ipcRenderer.invoke('lyric-convert-romaji', text);
};

const convertRomajiTokens = (text: string) => {
    return ipcRenderer.invoke('lyric-convert-romaji-tokens', text);
};

export const lyrics = {
    convertFurigana,
    convertFuriganaFragment,
    convertRomaji,
    convertRomajiTokens,
    getRemoteLyricsByRemoteId,
    getRemoteLyricsBySong,
    parseLyricsTextTokens,
    searchRemoteLyrics,
};

export type Lyrics = typeof lyrics;
