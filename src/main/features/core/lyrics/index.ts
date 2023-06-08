import {
  InternetProviderLyricResponse,
  InternetProviderLyricSearchResponse,
  LyricSearchQuery,
  QueueSong,
} from '/@/renderer/api/types';
import { query as queryGenius, getSearchResults as searchGenius } from './genius';
import { query as queryNetease, getSearchResults as searchNetease } from './netease';
import { LyricSource } from '../../../../renderer/types';
import { ipcMain } from 'electron';
import { store } from '../settings/index';

type SongFetcher = (params: LyricSearchQuery) => Promise<InternetProviderLyricResponse | null>;
type SearchFetcher = (
  params: LyricSearchQuery,
) => Promise<InternetProviderLyricSearchResponse[] | null>;

type CachedLyrics = Record<LyricSource, InternetProviderLyricResponse>;

const FETCHERS: Record<LyricSource, SongFetcher> = {
  [LyricSource.GENIUS]: queryGenius,
  [LyricSource.NETEASE]: queryNetease,
};

const SEARCH_FETCHERS: Record<LyricSource, SearchFetcher> = {
  [LyricSource.GENIUS]: searchGenius,
  [LyricSource.NETEASE]: searchNetease,
};

const MAX_CACHED_ITEMS = 10;

const lyricCache = new Map<string, CachedLyrics>();

const getRemoteLyrics = async (song: QueueSong) => {
  const sources = store.get('lyrics', []) as LyricSource[];

  const cached = lyricCache.get(song.id);

  if (cached) {
    for (const source of sources) {
      const data = cached[source];
      if (data) return data;
    }
  }

  let lyricsFromSource = null;

  for (const source of sources) {
    const params = { artist: song.artistName, name: song.name };
    const response = await FETCHERS[source](params);

    if (response) {
      const newResult = cached
        ? {
            ...cached,
            [source]: response,
          }
        : ({ [source]: response } as CachedLyrics);

      if (lyricCache.size === MAX_CACHED_ITEMS && cached === undefined) {
        const toRemove = lyricCache.keys().next().value;
        lyricCache.delete(toRemove);
      }

      lyricCache.set(song.id, newResult);

      lyricsFromSource = response;
      break;
    }
  }

  return lyricsFromSource;
};

const searchRemoteLyrics = async (params: LyricSearchQuery) => {
  const sources = store.get('lyrics', []) as LyricSource[];

  const results: Record<LyricSource, InternetProviderLyricSearchResponse[]> = {
    [LyricSource.GENIUS]: [],
    [LyricSource.NETEASE]: [],
  };

  for (const source of sources) {
    const response = await SEARCH_FETCHERS[source](params);

    if (response) {
      response.forEach((result) => {
        results[source].push(result);
      });
    }
  }

  return results;
};

ipcMain.handle('lyric-fetch-manual', async (_event, song: QueueSong) => {
  const lyric = await getRemoteLyrics(song);
  return lyric;
});

ipcMain.handle('lyric-search', async (_event, params: LyricSearchQuery) => {
  const lyricResults = await searchRemoteLyrics(params);
  return lyricResults;
});
