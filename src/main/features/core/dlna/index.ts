import { ipcMain } from 'electron';
import {
    DlnaChangedTrack,
    DlnaInitialize,
    DlnaQueue,
    DlnaQueueItem,
} from '/@/shared/types/types';
import {
    getTime,
    load,
    pause,
    play,
    seekTo,
    createClient,
    setVolume,
    stop,
    enqueue,
    setMute,
} from '/@/main/features/core/dlna/controller';
import { getMainWindow } from '/@/main/index';
import { discoverDlnaDevices } from '/@/main/features/core/dlna/discovery';

ipcMain.handle('dlna-discover', async () => discoverDlnaDevices());

ipcMain.handle('dlna-initialize', async (_event, data: DlnaInitialize) => {
    const client = createClient(data.deviceUrl);

    setVolume(data.volume);

    client.on('status', (status) => {
        return console.log(`DLNA status change: ${JSON.stringify(status)}`);
    });

    client.on('changedTrack', (trackUrl) => {
        const data: DlnaChangedTrack = { trackUrl };
        getMainWindow()?.webContents.send('renderer-dlna-changed-track', data);
    });
});

ipcMain.on('dlna-set-queue', async (_event, queue: DlnaQueue) => {
    await load(queue.current);
    if (queue.next) await enqueue(queue.next);
    if (!queue.isPaused) play();
});

ipcMain.on('dlna-set-queue-next', async (_event, item: DlnaQueueItem) => await enqueue(item));

ipcMain.on('dlna-play', (_event, speed?: number) => play({ speed: speed }));

ipcMain.on('dlna-pause', () => pause());

ipcMain.on('dlna-stop', () => stop());

ipcMain.handle('dlna-get-time', async () => await getTime());

ipcMain.on('dlna-seek-to', (_event, seconds: number) => seekTo(seconds));

ipcMain.on('dlna-volume', (_event, volume: number) => setVolume(volume));

ipcMain.on('dlna-mute', (_event, isMuted: boolean) => setMute(isMuted));
