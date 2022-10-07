import { ipcMain } from 'electron';
import MpvAPI from 'node-mpv';
import { getWindow } from '../../..';

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
      getWindow()?.webContents.send('renderer-player-auto-next');
    }
  }
});

// Automatically updates the play button when the player is playing
mpv.on('started', () => {
  getWindow()?.webContents.send('renderer-player-play');
});

// Automatically updates the play button when the player is stopped
mpv.on('stopped', () => {
  getWindow()?.webContents.send('renderer-player-stop');
});

// Automatically updates the play button when the player is paused
mpv.on('paused', () => {
  getWindow()?.webContents.send('renderer-player-pause');
});

mpv.on('quit', () => {
  console.log('mpv quit');
});

// Event output every interval set by time_update, used to update the current time
mpv.on('timeposition', (time: number) => {
  getWindow()?.webContents.send('renderer-player-current-time', time);
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
  await mpv.prev();
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
  await mpv.seek(time);
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
  await mpv.goToPosition(time);
});

// Sets the queue in position 0 and 1 to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: any) => {
  if (data.queue.current) {
    await mpv.load(data.queue.current.streamUrl, 'replace');
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: any) => {
  const size = await mpv.getPlaylistSize();

  if (size > 1) {
    await mpv.playlistRemove(1);
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: any) => {
  // Always keep the current song as position 0 in the mpv queue
  // This allows us to easily set update the next song in the queue without
  // disturbing the currently playing song
  await mpv.playlistRemove(0);

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
