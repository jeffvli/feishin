import { IpcRendererEvent, ipcRenderer } from 'electron';
import { InternetProviderLyricResponse, QueueSong } from '/@/renderer/api/types';

const fetchRemoteLyrics = (song: QueueSong) => {
  ipcRenderer.send('lyric-fetch', song);
};

const remoteLyricsListener = (
  cb: (
    event: IpcRendererEvent,
    songName: string,
    source: string,
    lyric: InternetProviderLyricResponse,
  ) => void,
) => {
  ipcRenderer.on('lyric-get', cb);
};

export const lyrics = {
  fetchRemoteLyrics,
  remoteLyricsListener,
};
