import { app, ipcMain, Menu } from 'electron';

import { getMainWindow } from '/@/main/index';
import { PlayerStatus } from '/@/shared/types/types';

let currentStatus: PlayerStatus = PlayerStatus.PAUSED;

const updateDockMenu = () => {
    if (!app.dock) return;

    const isPlaying = currentStatus === PlayerStatus.PLAYING;

    const dockMenu = Menu.buildFromTemplate([
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-play-pause');
            },
            label: isPlaying ? 'Pause' : 'Play',
        },
        {
            type: 'separator',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-next');
            },
            label: 'Next',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-previous');
            },
            label: 'Previous',
        },
        {
            type: 'separator',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-stop');
            },
            label: 'Stop',
        },
    ]);

    app.dock.setMenu(dockMenu);
};

ipcMain.on('update-playback', (_event, status: PlayerStatus) => {
    currentStatus = status;
    updateDockMenu();
});

// Initialize dock menu after app is ready
app.whenReady().then(() => {
    updateDockMenu();
});
