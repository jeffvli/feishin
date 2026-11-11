import axios, { AxiosResponse } from 'axios';

import { InternetProviderLyricSearchResponse, LyricSearchQuery, LyricSource } from '.';
import { orderSearchResults } from './shared';

import log from '/@/main/logger';

const BASE_URL = 'https://lrc.red';

const TIMEOUT_MS = 5000;

interface LrcRedSearchHit {
    album: string;
    artist: string;
    color?: string;
    cover?: string;
    duration?: number;
    isrc: string;
    title: string;
    year?: number;
}

interface LrcRedSearchResponse {
    hits: LrcRedSearchHit[];
    next?: string;
}

interface LrcRedTrack {
    artist: string;
    files: {
        lrc: string;
        lyricsfile?: string;
        ttml?: string;
    };
    isrc: string;
    title: string;
}



export async function getLyricsBySongId(isrc: string): Promise<null | string> {
    let result: AxiosResponse<LrcRedTrack>;
    try {
        result = await axios.get<LrcRedTrack>(`${BASE_URL}/s/${isrc}.json`, {
            headers: requestHeaders(),
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        log.error(`LRC.Red track request got an error for ISRC ${isrc}!`, (e as Error)?.message);
        return null;
    }

    const lrcUrl = result.data.files?.lrc;
    if (!lrcUrl) return null;

    let lrc: AxiosResponse<string>;
    try {
        lrc = await axios.get<string>(lrcUrl, {
            headers: requestHeaders(),
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        log.error(`LRC.Red lyrics request got an error for ISRC ${isrc}!`, (e as Error)?.message);
        return null;
    }

    return lrc.data || null;
}

export async function getSearchResults(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
    if (!params.name && !params.artist) {
        return null;
    }

    const searchQuery = [params.artist, params.name].join(' ');

    let result: AxiosResponse<LrcRedSearchResponse>;
    try {
        result = await axios.get<LrcRedSearchResponse>(`${BASE_URL}/search.json`, {
            headers: requestHeaders(),
            params: {
                in: 'lyrics',
                q: searchQuery,
            },
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        log.error('LRC.Red search request got an error!', (e as Error)?.message);
        return null;
    }

    if (!result.data?.hits) return null;

    const songResults: InternetProviderLyricSearchResponse[] = result.data.hits.map((hit) => ({
        artist: hit.artist,
        id: hit.isrc,
        isSync: true,
        name: hit.title,
        source: LyricSource.LRC_RED,
    }));

    return orderSearchResults({ params, results: songResults });
}
