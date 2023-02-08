import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { PlayerData } from '../renderer/store';
import { browser } from './preload/browser';
import { ipc } from './preload/ipc';
import { localSettings } from './preload/local-settings';
import { mpris } from './preload/mpris';
import { mpvPlayer, mpvPlayerListener } from './preload/mpv-player';
import { utils } from './preload/utils';

contextBridge.exposeInMainWorld('electron', {
  browser,
  ipc,
  ipcRenderer: {
    APP_RESTART() {
      ipcRenderer.send('app-restart');
    },
    PLAYER_AUTO_NEXT(data: PlayerData) {
      ipcRenderer.send('player-auto-next', data);
    },
    PLAYER_CURRENT_TIME() {
      ipcRenderer.send('player-current-time');
    },
    PLAYER_MEDIA_KEYS_DISABLE() {
      ipcRenderer.send('global-media-keys-disable');
    },
    PLAYER_MEDIA_KEYS_ENABLE() {
      ipcRenderer.send('global-media-keys-enable');
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
    RENDERER_PLAYER_AUTO_NEXT(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-auto-next', cb);
    },
    RENDERER_PLAYER_CURRENT_TIME(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-current-time', cb);
    },
    RENDERER_PLAYER_NEXT(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-next', cb);
    },
    RENDERER_PLAYER_PAUSE(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-pause', cb);
    },
    RENDERER_PLAYER_PLAY(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-play', cb);
    },
    RENDERER_PLAYER_PLAY_PAUSE(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-play-pause', cb);
    },
    RENDERER_PLAYER_PREVIOUS(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-previous', cb);
    },
    RENDERER_PLAYER_STOP(cb: (event: IpcRendererEvent, data: any) => void) {
      ipcRenderer.on('renderer-player-stop', cb);
    },
    SETTINGS_GET(data: { property: string }) {
      return ipcRenderer.invoke('settings-get', data);
    },
    SETTINGS_SET(data: { property: string; value: any }) {
      ipcRenderer.send('settings-set', data);
    },
    removeAllListeners(value: string) {
      ipcRenderer.removeAllListeners(value);
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
  localSettings,
  mpris,
  mpvPlayer,
  mpvPlayerListener,
  utils,
});
