/* eslint-disable promise/always-return */
import { BrowserWindow, globalShortcut } from 'electron';

export const enableMediaKeys = (window: BrowserWindow | null) => {
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
};

export const disableMediaKeys = () => {
    globalShortcut.unregister('MediaStop');
    globalShortcut.unregister('MediaPlayPause');
    globalShortcut.unregister('MediaNextTrack');
    globalShortcut.unregister('MediaPreviousTrack');
};
