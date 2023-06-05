import { InternetProviderLyricResponse, QueueSong } from '/@/renderer/api/types';
import { query as queryGenius } from './genius';
import { query as queryNetease } from './netease';
import { LyricSource } from '../../../../renderer/types';
import { ipcMain } from 'electron';
import { getMainWindow } from '../../../main';
import { store } from '../settings/index';

type SongFetcher = (song: QueueSong) => Promise<InternetProviderLyricResponse | null>;

type CachedLyrics = Record<LyricSource, InternetProviderLyricResponse>;

const FETCHERS: Record<LyricSource, SongFetcher> = {
  [LyricSource.GENIUS]: queryGenius,
  [LyricSource.NETEASE]: queryNetease,
};

const MAX_CACHED_ITEMS = 10;

const lyricCache = new Map<string, CachedLyrics>();

ipcMain.on('lyric-fetch', async (_event, song: QueueSong) => {
  const sources = store.get('lyrics', []) as LyricSource[];

  const cached = lyricCache.get(song.id);

  if (cached) {
    for (const source of sources) {
      const data = cached[source];

      if (data) {
        getMainWindow()?.webContents.send('lyric-get', song.name, source, data);
        return;
      }
    }
  }

  for (const source of sources) {
    const lyric = await FETCHERS[source](song);
    if (lyric) {
      const newResult = cached
        ? {
            ...cached,
            [source]: lyric,
          }
        : ({ [source]: lyric } as CachedLyrics);

      if (lyricCache.size === MAX_CACHED_ITEMS && cached === undefined) {
        const toRemove = lyricCache.keys().next().value;
        lyricCache.delete(toRemove);
      }

      lyricCache.set(song.id, newResult);

      getMainWindow()?.webContents.send('lyric-get', song.name, source, lyric);
      break;
    }
  }
});
