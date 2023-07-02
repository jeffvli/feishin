// Credits to https://github.com/tranxuanthang/lrcget for API implementation
import axios, { AxiosResponse } from 'axios';
import {
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
    LyricSource,
} from '../../../../renderer/api/types';
import { orderSearchResults } from './shared';

const FETCH_URL = 'https://lrclib.net/api/get';
const SEEARCH_URL = 'https://lrclib.net/api/search';

const TIMEOUT_MS = 5000;

export interface LrcLibSearchResponse {
    albumName: string;
    artistName: string;
    id: number;
    name: string;
}

export interface LrcLibTrackResponse {
    albumName: string;
    artistName: string;
    duration: number;
    id: number;
    instrumental: boolean;
    isrc: string;
    lang: string;
    name: string;
    plainLyrics: string | null;
    releaseDate: string;
    spotifyId: string;
    syncedLyrics: string | null;
}

export async function getSearchResults(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
    let result: AxiosResponse<LrcLibSearchResponse[]>;

    if (!params.name) {
        return null;
    }

    try {
        result = await axios.get<LrcLibSearchResponse[]>(SEEARCH_URL, {
            params: {
                q: params.name,
            },
        });
    } catch (e) {
        console.error('LrcLib search request got an error!', e);
        return null;
    }

    if (!result.data) return null;

    const songResults: InternetProviderLyricSearchResponse[] = result.data.map((song) => {
        return {
            artist: song.artistName,
            id: String(song.id),
            name: song.name,
            source: LyricSource.LRCLIB,
        };
    });

    return orderSearchResults({ params, results: songResults });
}

export async function getLyricsBySongId(songId: string): Promise<string | null> {
    let result: AxiosResponse<LrcLibTrackResponse, any>;

    try {
        result = await axios.get<LrcLibTrackResponse>(`${FETCH_URL}/${songId}`);
    } catch (e) {
        console.error('LrcLib lyrics request got an error!', e);
        return null;
    }

    return result.data.syncedLyrics || result.data.plainLyrics || null;
}

export async function query(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
    let result: AxiosResponse<LrcLibTrackResponse, any>;

    try {
        result = await axios.get<LrcLibTrackResponse>(FETCH_URL, {
            params: {
                album_name: params.album,
                artist_name: params.artist,
                duration: params.duration,
                track_name: params.name,
            },
            timeout: TIMEOUT_MS,
        });
    } catch (e) {
        console.error('LrcLib search request got an error!', e);
        return null;
    }

    const lyrics = result.data.syncedLyrics || result.data.plainLyrics || null;

    if (!lyrics) {
        console.error(`Could not get lyrics on LrcLib!`);
        return null;
    }

    return {
        artist: result.data.artistName,
        id: String(result.data.id),
        lyrics,
        name: result.data.name,
        source: LyricSource.LRCLIB,
    };
}
