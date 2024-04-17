/* eslint-disable promise/always-return */
import { BrowserWindow, globalShortcut, systemPreferences } from 'electron';
import { isMacOS } from '../../../utils';
import { store } from '../settings';

export const enableMediaKeys = (window: BrowserWindow | null) => {
    if (isMacOS()) {
        const shouldPrompt = store.get('should_prompt_accessibility', true) as boolean;
        const trusted = systemPreferences.isTrustedAccessibilityClient(shouldPrompt);

        if (shouldPrompt) {
            store.set('should_prompt_accessibility', false);
        }

        if (!trusted) {
            window?.webContents.send('toast-from-main', {
                message:
                    'Feishin is not a trusted accessibility client. Media keys will not work until this setting is changed',
                type: 'warning',
            });
        }
    }

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
