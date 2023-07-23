import { contextBridge } from 'electron';
import { browser } from './preload/browser';
import { ipc } from './preload/ipc';
import { localSettings } from './preload/local-settings';
import { lyrics } from './preload/lyrics';
import { mpris } from './preload/mpris';
import { mpvPlayer, mpvPlayerListener } from './preload/mpv-player';
import { remote } from './preload/remote';
import { utils } from './preload/utils';

contextBridge.exposeInMainWorld('electron', {
    browser,
    ipc,
    localSettings,
    lyrics,
    mpris,
    mpvPlayer,
    mpvPlayerListener,
    remote,
    utils,
});
