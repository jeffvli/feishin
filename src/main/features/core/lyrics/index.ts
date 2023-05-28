import { QueueSong } from '/@/renderer/api/types';
import { query as queryGenius } from './genius';
import { query as queryNetease } from './netease';
import { LyricSource } from '../../../../renderer/types';
import { ipcMain } from 'electron';
import { getMainWindow } from '../../../main';
import { store } from '../settings/index';

type SongFetcher = (song: QueueSong) => Promise<string | null>;

const FETCHERS: Record<LyricSource, SongFetcher> = {
  [LyricSource.GENIUS]: queryGenius,
  [LyricSource.NETEASE]: queryNetease,
};

ipcMain.on('lyric-fetch', async (_event, song: QueueSong) => {
  const sources = store.get('lyrics', []) as LyricSource[];

  for (const source of sources) {
    const lyric = await FETCHERS[source](song);
    if (lyric) {
      getMainWindow()?.webContents.send('lyric-get', song.name, source, lyric);
      break;
    }
  }
});
