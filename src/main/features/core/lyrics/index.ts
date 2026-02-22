import { ipcMain } from 'electron';

import { store } from '../settings';
import { getLyricsBySongId as getGenius, getSearchResults as searchGenius } from './genius';
import { getLyricsBySongId as getLrcLib, getSearchResults as searchLrcLib } from './lrclib';
import { getLyricsBySongId as getNetease, getSearchResults as searchNetease } from './netease';
import { orderSearchResults } from './shared';

import { Song } from '/@/shared/types/domain-types';

export enum LyricSource {
    GENIUS = 'Genius',
    LRCLIB = 'lrclib.net',
    NETEASE = 'NetEase',
}

export type FullLyricsMetadata = Omit<InternetProviderLyricResponse, 'id' | 'lyrics' | 'source'> & {
    lyrics: LyricsResponse;
    remote: boolean;
    source: string;
};

export type InternetProviderLyricResponse = {
    artist: string;
    id: string;
    lyrics: string;
    name: string;
    source: LyricSource;
};

export type InternetProviderLyricSearchResponse = {
    artist: string;
    id: string;
    isSync: boolean | null;
    name: string;
    score?: number;
    source: LyricSource;
};

export type LyricGetQuery = {
    remoteSongId: string;
    remoteSource: LyricSource;
    song: Song;
};

export type LyricOverride = Omit<InternetProviderLyricResponse, 'lyrics'>;

export type LyricSearchQuery = {
    album?: string;
    artist?: string;
    duration?: number;
    name?: string;
};

export type LyricsResponse = string | SynchronizedLyricsArray;

export type SynchronizedLyricsArray = Array<[number, string]>;

type CachedLyrics = Record<LyricSource, InternetProviderLyricResponse>;
type GetFetcher = (id: string) => Promise<null | string>;
type SearchFetcher = (
    params: LyricSearchQuery,
) => Promise<InternetProviderLyricSearchResponse[] | null>;

const SEARCH_FETCHERS: Record<LyricSource, SearchFetcher> = {
    [LyricSource.GENIUS]: searchGenius,
    [LyricSource.LRCLIB]: searchLrcLib,
    [LyricSource.NETEASE]: searchNetease,
};

const GET_FETCHERS: Record<LyricSource, GetFetcher> = {
    [LyricSource.GENIUS]: getGenius,
    [LyricSource.LRCLIB]: getLrcLib,
    [LyricSource.NETEASE]: getNetease,
};

const MAX_CACHED_ITEMS = 10;

const lyricCache = new Map<string, CachedLyrics>();

const searchAllSources = async (
    params: LyricSearchQuery,
): Promise<InternetProviderLyricSearchResponse[]> => {
    const sources = store.get('lyrics', []) as LyricSource[];

    const searchPromises = sources.map((source) =>
        SEARCH_FETCHERS[source](params).then((searchResults) => ({ searchResults, source })),
    );

    const settled = await Promise.allSettled(searchPromises);

    const allSearchResults: InternetProviderLyricSearchResponse[] = [];

    for (const result of settled) {
        if (result.status === 'fulfilled' && result.value.searchResults) {
            allSearchResults.push(...result.value.searchResults);
        } else if (result.status === 'rejected') {
            const index = settled.indexOf(result);
            console.error(`Error searching ${sources[index]} for lyrics:`, result.reason);
        }
    }
    return allSearchResults;
};

const getRemoteLyrics = async (song: Song) => {
    const sources = store.get('lyrics', []) as LyricSource[];

    const cached = lyricCache.get(song.id.toString());

    if (cached) {
        for (const source of sources) {
            const data = cached[source];
            if (data) return data;
        }
    }

    const params: LyricSearchQuery = {
        album: song.album || song.name,
        artist: song.artists[0].name,
        duration: song.duration / 1000.0,
        name: song.name,
    };

    const allSearchResults = await searchAllSources(params);

    if (allSearchResults.length === 0) {
        return null;
    }

    const rankedResults = orderSearchResults({
        params,
        results: allSearchResults,
    });

    const bestMatch = rankedResults[0];

    if (!bestMatch) {
        return null;
    }

    // Score is 0-1 where 0 = perfect match, 1 = worst match
    const matchThreshold = 0.55;
    const matchScore = bestMatch.score ?? 1;

    if (matchScore > matchThreshold) {
        return null;
    }

    let lyricsFromSource: InternetProviderLyricResponse | null = null;

    try {
        const lyrics = await GET_FETCHERS[bestMatch.source](bestMatch.id);
        if (lyrics) {
            lyricsFromSource = {
                artist: bestMatch.artist,
                id: bestMatch.id,
                lyrics,
                name: bestMatch.name,
                source: bestMatch.source,
            };
        }
    } catch (error) {
        console.error(`Error fetching lyrics from ${bestMatch.source}:`, error);
    }

    if (lyricsFromSource) {
        const newResult = cached
            ? {
                  ...cached,
                  [lyricsFromSource.source]: lyricsFromSource,
              }
            : ({ [lyricsFromSource.source]: lyricsFromSource } as CachedLyrics);

        if (lyricCache.size === MAX_CACHED_ITEMS && cached === undefined) {
            const toRemove = lyricCache.keys().next().value;
            if (toRemove) {
                lyricCache.delete(toRemove);
            }
        }

        lyricCache.set(song.id.toString(), newResult);
    }

    return lyricsFromSource;
};

const searchRemoteLyrics = async (params: LyricSearchQuery) => {
    const allSearchResults = await searchAllSources(params);

    const results: Record<LyricSource, InternetProviderLyricSearchResponse[]> = {
        [LyricSource.GENIUS]: [],
        [LyricSource.LRCLIB]: [],
        [LyricSource.NETEASE]: [],
    };
    for (const item of allSearchResults) {
        results[item.source].push(item);
    }
    return results;
};

const getRemoteLyricsById = async (params: LyricGetQuery): Promise<null | string> => {
    const { remoteSongId, remoteSource } = params;
    const response = await GET_FETCHERS[remoteSource](remoteSongId);

    if (!response) {
        return null;
    }

    return response;
};

ipcMain.handle('lyric-by-song', async (_event, song: any) => {
    const lyric = await getRemoteLyrics(song);
    return lyric;
});

ipcMain.handle('lyric-search', async (_event, params: LyricSearchQuery) => {
    const lyricResults = await searchRemoteLyrics(params);
    return lyricResults;
});

ipcMain.handle('lyric-by-remote-id', async (_event, params: LyricGetQuery) => {
    const lyricResults = await getRemoteLyricsById(params);
    return lyricResults;
});
