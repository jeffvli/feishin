import axios, { AxiosResponse } from 'axios';

import {
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
    LyricSource,
} from '.';
import { orderSearchResults } from './shared';

const API_URL = 'https://api-lyrics.simpmusic.org/v1';

const TIMEOUT_MS = 5000;

export interface SimpMusicLyric {
    albumName?: string;
    artistName: string;
    durationSeconds?: number;
    id: string;
    plainLyric?: string;
    richSyncLyrics?: string;
    songTitle: string;
    syncedLyrics?: string;
    videoId: string;
    vote?: number;
}

export interface SimpMusicSearchResponse {
    data: SimpMusicLyric[];
    success: boolean;
}

export async function getLyricsBySongId(songId: string): Promise<null | string> {
    let result: AxiosResponse;

    try {
        result = await axios.get(`${API_URL}/${songId}`, {
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        console.error('SimpMusic lyrics request errored:', (e as Error)?.message);
        return null;
    }

    const firstLyric = (result.data.data?.[0] ?? null) as null | SimpMusicLyric;
    if (!firstLyric) return null;

    return firstLyric.syncedLyrics || firstLyric.plainLyric || null;
}

export async function getSearchResults(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
    let result: AxiosResponse<SimpMusicSearchResponse>;

    if (!params.name) return null;

    try {
        result = await axios.get<SimpMusicSearchResponse>(`${API_URL}/search`, {
            params: {
                q: params.name,
            },
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        console.error('SimpMusic search errored:', (e as Error)?.message);
        return null;
    }

    if (!result.data?.data) return null;

    const songResults: InternetProviderLyricSearchResponse[] = result.data.data.map((song) => ({
        artist: song.artistName,
        id: song.videoId,
        isSync: song.syncedLyrics ? true : false,
        name: song.songTitle,
        source: LyricSource.SIMPMUSIC,
    }));

    return orderSearchResults({ params, results: songResults });
}

export async function query(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
    if (!params.name) return null;

    let search: AxiosResponse<SimpMusicSearchResponse>;

    try {
        search = await axios.get<SimpMusicSearchResponse>(`${API_URL}/search`, {
            params: {
                q: params.name,
            },
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        console.error('SimpMusic search errored:', (e as Error).message);
        return null;
    }

    const first = search.data?.data?.[0];
    if (!first) return null;

    let lyric: AxiosResponse<SimpMusicLyric>;

    try {
        lyric = await axios.get<SimpMusicLyric>(`${API_URL}/${first.videoId}`, {
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        console.error('SimpMusic lyrics fetch errored:', (e as Error).message);
        return null;
    }

    const lyrics = lyric.data.syncedLyrics || lyric.data.plainLyric || null;
    if (!lyrics) return null;

    return {
        artist: lyric.data.artistName,
        id: lyric.data.videoId,
        lyrics,
        name: lyric.data.songTitle,
        source: LyricSource.SIMPMUSIC,
    };
}
