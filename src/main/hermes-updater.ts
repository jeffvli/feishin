import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

import log from './logger';

// Hermes Music edition (Windows, Linux AppImage/deb): updates download in the background and
// the app shows an Update button; clicking it restarts into the new version. Otherwise the update
// installs when Feishin closes. Checks again every 30 minutes while Feishin is open.
interface HermesUpdate {
    percent?: number;
    state: 'downloading' | 'ready';
    version: string;
}

let hermesUpdate: HermesUpdate | null = null;

export function startHermesUpdater(options: {
    beforeInstall: () => void;
    getWindow: () => BrowserWindow | null | undefined;
}) {
    const send = (update: HermesUpdate) => {
        hermesUpdate = update;
        options.getWindow()?.webContents.send('hermes-update', update);
    };

    autoUpdater.autoDownload = true;
    autoUpdater.on('update-available', (info) =>
        send({ percent: 0, state: 'downloading', version: info.version }),
    );
    autoUpdater.on('download-progress', (progress) => {
        const percent = Math.floor(progress.percent);
        if (hermesUpdate?.state === 'downloading' && percent !== hermesUpdate.percent) {
            send({ ...hermesUpdate, percent });
        }
    });
    autoUpdater.on('update-downloaded', (info) => send({ state: 'ready', version: info.version }));
    ipcMain.handle('hermes-update-state', () => hermesUpdate);
    ipcMain.on('hermes-update-install', () => {
        if (hermesUpdate?.state !== 'ready') return;
        log.info('Installing update', { version: hermesUpdate.version });
        options.beforeInstall();
        autoUpdater.quitAndInstall(true, true);
    });

    const check = () =>
        autoUpdater.checkForUpdates().catch((err) => log.warn('Check for updates failed', err));
    check();
    setInterval(
        () => {
            if (!hermesUpdate) check();
        },
        30 * 60 * 1000,
    );
}
