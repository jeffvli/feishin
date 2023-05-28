import { IpcRendererEvent, ipcRenderer } from 'electron';
import { QueueSong } from '/@/renderer/api/types';

const fetchLyrics = (song: QueueSong) => {
  ipcRenderer.send('lyric-fetch', song);
};

const getLyrics = (
  cb: (event: IpcRendererEvent, songName: string, source: string, lyric: string) => void,
) => {
  ipcRenderer.on('lyric-get', cb);
};

export const lyrics = {
  fetchLyrics,
  getLyrics,
};
