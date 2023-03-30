import { contextBridge } from 'electron';
import { browser } from './preload/browser';
import { ipc } from './preload/ipc';
import { localSettings } from './preload/local-settings';
import { mpris } from './preload/mpris';
import { mpvPlayer, mpvPlayerListener } from './preload/mpv-player';
import { utils } from './preload/utils';

contextBridge.exposeInMainWorld('electron', {
  browser,
  ipc,
  localSettings,
  mpris,
  mpvPlayer,
  mpvPlayerListener,
  utils,
});
