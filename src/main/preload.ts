import { contextBridge } from 'electron';
import { browser } from './preload/browser';
import { discordRpc } from './preload/discord-rpc';
import { ipc } from './preload/ipc';
import { localSettings } from './preload/local-settings';
import { lyrics } from './preload/lyrics';
import { mpris } from './preload/mpris';
import { mpvPlayer, mpvPlayerListener } from './preload/mpv-player';
import { remote } from './preload/remote';
import { utils } from './preload/utils';

const disableMpv = localSettings.get('disable_mpv');

contextBridge.exposeInMainWorld('electron', {
    browser,
    discordRpc,
    ipc,
    localSettings,
    lyrics,
    mpris,
    mpvPlayer: disableMpv ? undefined : mpvPlayer,
    mpvPlayerListener: disableMpv ? undefined : mpvPlayerListener,
    remote,
    utils,
});
