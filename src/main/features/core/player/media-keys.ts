import { BrowserWindow, globalShortcut } from 'electron';

import { isLinux } from '../../../utils';
import { store } from '../settings';

import { PlayerType } from '/@/shared/types/types';

export const enableMediaKeys = (window: BrowserWindow | null) => {
    const enableMediaSession = store.get('mediaSession', false) as boolean;
    const playbackType = store.get('playbackType', PlayerType.WEB) as PlayerType;

    if (!enableMediaSession || isLinux() || playbackType !== PlayerType.WEB) {
        globalShortcut.register('MediaStop', () => {
            window?.webContents.send('renderer-player-stop');
        });

        globalShortcut.register('MediaPlayPause', () => {
            window?.webContents.send('renderer-player-play-pause');
        });

        globalShortcut.register('MediaNextTrack', () => {
            window?.webContents.send('renderer-player-next');
        });

        globalShortcut.register('MediaPreviousTrack', () => {
            window?.webContents.send('renderer-player-previous');
        });
    }
};

export const disableMediaKeys = () => {
    globalShortcut.unregister('MediaStop');
    globalShortcut.unregister('MediaPlayPause');
    globalShortcut.unregister('MediaNextTrack');
    globalShortcut.unregister('MediaPreviousTrack');
};
