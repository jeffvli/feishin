import { InternetProviderLyricResponse, QueueSong } from '/@/renderer/api/types';
import { query as queryGenius } from './genius';
import { query as queryNetease } from './netease';
import { LyricSource } from '../../../../renderer/types';
import { ipcMain } from 'electron';
import { store } from '../settings/index';

type SongFetcher = (song: QueueSong) => Promise<InternetProviderLyricResponse | null>;

type CachedLyrics = Record<LyricSource, InternetProviderLyricResponse>;

const FETCHERS: Record<LyricSource, SongFetcher> = {
  [LyricSource.GENIUS]: queryGenius,
  [LyricSource.NETEASE]: queryNetease,
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
    const response = await FETCHERS[source](song);
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

ipcMain.handle('lyric-fetch-manual', async (_event, song: QueueSong) => {
  const lyric = await getRemoteLyrics(song);
  return lyric;
});
