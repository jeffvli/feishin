import { IpcRendererEvent, ipcRenderer } from 'electron';
import { InternetProviderLyricResponse, LyricSearchQuery, QueueSong } from '/@/renderer/api/types';

const fetchRemoteLyrics = (song: QueueSong) => {
  const result = ipcRenderer.invoke('lyric-fetch-manual', song);
  return result;
};

const searchRemoteLyrics = (params: LyricSearchQuery) => {
  const result = ipcRenderer.invoke('lyric-search', params);
  return result;
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
  searchRemoteLyrics,
};
