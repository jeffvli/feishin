import { ipcMain } from 'electron';
import MpvAPI from 'node-mpv';
import { PlayerData } from '../../../../renderer/store';
import { getMainWindow } from '../../../main';

const mpv = new MpvAPI(
  {
    audio_only: true,
    auto_restart: true,
    binary: 'C:/ProgramData/chocolatey/lib/mpv.install/tools/mpv.exe',
    time_update: 1,
  },
  ['--gapless-audio=yes', '--prefetch-playlist']
);

mpv.start().catch((error: any) => {
  console.log('error', error);
});

mpv.on('status', (status: any) => {
  if (status.property === 'playlist-pos') {
    if (status.value !== 0) {
      getMainWindow()?.webContents.send('renderer-player-set-queue-next');
    }
  }
});

// Automatically updates the play button when the player is playing
mpv.on('started', () => {
  getMainWindow()?.webContents.send('renderer-player-play');
});

// Automatically updates the play button when the player is stopped
mpv.on('stopped', () => {
  getMainWindow()?.webContents.send('renderer-player-stop');
});

// Automatically updates the play button when the player is paused
mpv.on('paused', () => {
  getMainWindow()?.webContents.send('renderer-player-pause');
});

mpv.on('quit', () => {
  console.log('mpv quit');
});

// Event output every interval set by time_update, used to update the current time
mpv.on('timeposition', (time: number) => {
  getMainWindow()?.webContents.send('renderer-player-current-time', time);
});

mpv.on('seek', () => {
  console.log('mpv seek');
});

// Starts the player
ipcMain.on('player-play', async () => {
  await mpv.play();
});

// Pauses the player
ipcMain.on('player-pause', async () => {
  await mpv.pause();
});

// Stops the player
ipcMain.on('player-stop', async () => {
  await mpv.stop();
});

// Stops the player
ipcMain.on('player-next', async () => {
  await mpv.next();
});

// Stops the player
ipcMain.on('player-previous', async () => {
  await mpv.previous();
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
  await mpv.seek(time);
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
  await mpv.goToPosition(time);
});

// Sets the queue to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: PlayerData) => {
  if (data.queue.current) {
    await mpv.load(data.queue.current.streamUrl, 'replace');
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the volume to the given value (0-100)
ipcMain.on('player-volume', async (_event, value: number) => {
  mpv.volume(value);
});

// Toggles the mute status
ipcMain.on('player-mute', async () => {
  mpv.mute();
});
