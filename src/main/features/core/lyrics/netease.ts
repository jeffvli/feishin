import axios, { AxiosResponse } from 'axios';

import {
    InternetProviderLyricResponse,
    InternetProviderLyricSearchResponse,
    LyricSearchQuery,
    LyricSource,
} from '.';
import { store } from '../settings';
import { orderSearchResults } from './shared';

const SEARCH_URL = 'https://music.163.com/api/search/get';
const LYRICS_URL = 'https://music.163.com/api/song/lyric';

// Adapted from https://github.com/NyaomiDEV/Sunamu/blob/master/src/main/lyricproviders/netease.ts

export interface Result {
    hasMore: boolean;
    songCount: number;
    songs: Song[];
}

export interface Song {
    album: Album;
    alias: string[];
    artists: Artist[];
    copyrightId: number;
    duration: number;
    fee: number;
    ftype: number;
    id: number;
    mark: number;
    mvid: number;
    name: string;
    rtype: number;
    rUrl: null;
    status: number;
    transNames?: string[];
}

interface Album {
    artist: Artist;
    copyrightId: number;
    id: number;
    mark: number;
    name: string;
    picId: number;
    publishTime: number;
    size: number;
    status: number;
    transNames?: string[];
}

interface Artist {
    albumSize: number;
    alias: any[];
    fansGroup: null;
    id: number;
    img1v1: number;
    img1v1Url: string;
    name: string;
    picId: number;
    picUrl: null;
    trans: null;
}

interface NetEaseResponse {
    code: number;
    result: Result;
}

export async function getLyricsBySongId(songId: string): Promise<null | string> {
    let result: AxiosResponse<any, any>;
    try {
        result = await axios.get(LYRICS_URL, {
            params: {
                id: songId,
                kv: '-1',
                lv: '-1',
                tv: '-1',
            },
        });
    } catch (e) {
        console.error('NetEase lyrics request got an error!', e);
        return null;
    }
    const enableTranslation = store.get('enableNeteaseTranslation', true) as boolean;
    const originalLrc = result.data.lrc?.lyric;
    if (!enableTranslation) {
        return originalLrc || null;
    }
    const translatedLrc = result.data.tlyric?.lyric;
    return mergeLyrics(originalLrc, translatedLrc);
}

export async function getSearchResults(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[] | null> {
    let result: AxiosResponse<NetEaseResponse>;

    const searchQuery = [params.artist, params.name].join(' ');

    if (!searchQuery) {
        return null;
    }

    try {
        result = await axios.get(SEARCH_URL, {
            params: {
                limit: 5,
                offset: 0,
                s: searchQuery,
                type: '1',
            },
        });
    } catch (e) {
        console.error('NetEase search request got an error!', e);
        return null;
    }

    const rawSongsResult = result?.data.result?.songs;

    if (!rawSongsResult) return null;

    const songResults: InternetProviderLyricSearchResponse[] = rawSongsResult.map((song) => {
        const artist = song.artists ? song.artists.map((artist) => artist.name).join(', ') : '';

        return {
            artist,
            id: String(song.id),
            name: song.name,
            source: LyricSource.NETEASE,
        };
    });

    return orderSearchResults({ params, results: songResults });
}

export async function query(
    params: LyricSearchQuery,
): Promise<InternetProviderLyricResponse | null> {
    const lyricsMatch = await getMatchedLyrics(params);
    if (!lyricsMatch) {
        console.error('Could not find the song on NetEase!');
        return null;
    }

    const lyrics = await getLyricsBySongId(lyricsMatch.id);
    if (!lyrics) {
        console.error('Could not get lyrics on NetEase!');
        return null;
    }

    return {
        artist: lyricsMatch.artist,
        id: lyricsMatch.id,
        lyrics,
        name: lyricsMatch.name,
        source: LyricSource.NETEASE,
    };
}

async function getMatchedLyrics(
    params: LyricSearchQuery,
): Promise<null | Omit<InternetProviderLyricResponse, 'lyrics'>> {
    const results = await getSearchResults(params);

    const firstMatch = results?.[0];

    if (!firstMatch || (firstMatch?.score && firstMatch.score > 0.5)) {
        return null;
    }

    return firstMatch;
}

function mergeLyrics(original: string | undefined, translated: string | undefined): null | string {
    if (!original) {
        return null;
    }
    if (!translated) {
        return original;
    }

    const lrcLineRegex = /\[(\d{2}:\d{2}\.\d{2,3})\](.*)/;
    const translatedMap = new Map<string, string>();

    // Parse the translated LRC and store it in a Map for efficient timestamp-based lookups.
    translated.split('\n').forEach((line) => {
        const match = line.match(lrcLineRegex);
        if (match) {
            const timestamp = match[1];
            const text = match[2].trim();
            if (text) {
                translatedMap.set(timestamp, text);
            }
        }
    });

    if (translatedMap.size === 0) {
        return original;
    }

    // Iterate through each line of the original LRC. If a translation exists for
    // the same timestamp, insert it as a new, fully-formatted LRC line.
    const finalLines = original.split('\n').flatMap((line) => {
        const match = line.match(lrcLineRegex);

        if (match) {
            const timestamp = match[1];
            const translatedText = translatedMap.get(timestamp);

            if (translatedText) {
                // Return an array containing both the original line and the new translated line.
                // flatMap will flatten this into the final array of lines.
                const translatedLine = `[${timestamp}]${translatedText}`;
                return [line, translatedLine];
            }
        }

        // If no match or no translation is found, return only the original line.
        return [line];
    });

    return finalLines.join('\n');
}
