import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { PlayerData } from '../renderer/store';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    PLAYER_CURRENT_TIME() {
      ipcRenderer.send('player-current-time');
    },
    PLAYER_MUTE() {
      ipcRenderer.send('player-mute');
    },
    PLAYER_NEXT() {
      ipcRenderer.send('player-next');
    },
    PLAYER_PAUSE() {
      ipcRenderer.send('player-pause');
    },
    PLAYER_PLAY() {
      ipcRenderer.send('player-play');
    },
    PLAYER_PREVIOUS() {
      ipcRenderer.send('player-previous');
    },
    PLAYER_SEEK(seconds: number) {
      ipcRenderer.send('player-seek', seconds);
    },
    PLAYER_SEEK_TO(seconds: number) {
      ipcRenderer.send('player-seek-to', seconds);
    },
    PLAYER_SET_QUEUE(data: PlayerData) {
      ipcRenderer.send('player-set-queue', data);
    },
    PLAYER_SET_QUEUE_NEXT(data: PlayerData) {
      ipcRenderer.send('player-set-queue-next', data);
    },
    PLAYER_STOP() {
      ipcRenderer.send('player-stop');
    },
    PLAYER_VOLUME(value: number) {
      ipcRenderer.send('player-volume', value);
    },
    RENDERER_PLAYER_CURRENT_TIME(
      cb: (event: IpcRendererEvent, data: any) => void
    ) {
      ipcRenderer.on('renderer-player-current-time', cb);
    },
    RENDERER_PLAYER_PAUSE(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-pause', cb);
    },
    RENDERER_PLAYER_PLAY(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-play', cb);
    },
    RENDERER_PLAYER_SET_QUEUE_NEXT(
      cb: (event: IpcRendererEvent, data: any) => void
    ) {
      ipcRenderer.on('renderer-player-set-queue-next', cb);
    },
    RENDERER_PLAYER_STOP(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-stop', cb);
    },
    windowClose() {
      ipcRenderer.send('window-close');
    },
    windowMaximize() {
      ipcRenderer.send('window-maximize');
    },
    windowMinimize() {
      ipcRenderer.send('window-minimize');
    },
    windowUnmaximize() {
      ipcRenderer.send('window-unmaximize');
    },
  },
});
