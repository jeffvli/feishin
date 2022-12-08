import { ipcMain } from 'electron';
import MpvAPI from 'node-mpv';
import { store } from '../settings';
import uniq from 'lodash/uniq';
import type { PlayerData } from '../../../../../renderer/src/store/player.store';
import { getBrowserWindow } from '/@/mainWindow';

declare module 'node-mpv';

const BINARY_PATH = store.get('mpv_path') as string | undefined;
const MPV_PARAMETERS = store.get('mpv_parameters') as Array<string> | undefined;
const DEFAULT_MPV_PARAMETERS = () => {
  const parameters = [];
  if (
    !MPV_PARAMETERS?.includes('--gapless-audio=weak') ||
    !MPV_PARAMETERS?.includes('--gapless-audio=no') ||
    !MPV_PARAMETERS?.includes('--gapless-audio=yes') ||
    !MPV_PARAMETERS?.includes('--gapless-audio')
  ) {
    parameters.push('--gapless-audio=yes');
  }

  if (
    !MPV_PARAMETERS?.includes('--prefetch-playlist=no') ||
    !MPV_PARAMETERS?.includes('--prefetch-playlist=yes') ||
    !MPV_PARAMETERS?.includes('--prefetch-playlist')
  ) {
    parameters.push('--prefetch-playlist=yes');
  }

  return parameters;
};

const mpv = new MpvAPI(
  {
    audio_only: true,
    auto_restart: true,
    binary: BINARY_PATH || '',
    time_update: 1,
  },
  MPV_PARAMETERS
    ? uniq([...DEFAULT_MPV_PARAMETERS(), ...MPV_PARAMETERS])
    : DEFAULT_MPV_PARAMETERS(),
);

mpv
  .start()
  .then(async () => {
    // await mpv.load('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'replace');
    // await mpv.play();
  })
  .catch((error) => {
    console.log('error', error);
  });

mpv.on('status', (status) => {
  if (status.property === 'playlist-pos') {
    if (status.value !== 0) {
      getBrowserWindow()?.webContents.send('renderer-player-auto-next');
    }
  }
});

// Automatically updates the play button when the player is playing
mpv.on('resumed', () => {
  getBrowserWindow()?.webContents.send('renderer-player-play');
});

// Automatically updates the play button when the player is stopped
mpv.on('stopped', () => {
  getBrowserWindow()?.webContents.send('renderer-player-stop');
});

// Automatically updates the play button when the player is paused
mpv.on('paused', () => {
  getBrowserWindow()?.webContents.send('renderer-player-pause');
});

mpv.on('quit', () => {
  console.log('mpv quit');
});

// Event output every interval set by time_update, used to update the current time
mpv.on('timeposition', (time: number) => {
  getBrowserWindow()?.webContents.send('renderer-player-current-time', time);
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

// Goes to the next track in the playlist
ipcMain.on('player-next', async () => {
  await mpv.next();
});

// Goes to the previous track in the playlist
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
ipcMain.on('player-set-queue', async (_event, data: PlayerData) => {
  if (data.queue.current) {
    await mpv.load(data.queue.current.streamUrl, 'replace');
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
  const size = await mpv.getPlaylistSize();

  if (size > 1) {
    await mpv.playlistRemove(1);
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: PlayerData) => {
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
