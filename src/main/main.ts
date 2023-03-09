/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';
import electronLocalShortcut from 'electron-localshortcut';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import uniq from 'lodash/uniq';
import MpvAPI from 'node-mpv';
import { disableMediaKeys, enableMediaKeys } from './features/core/player/media-keys';
import { store } from './features/core/settings/index';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './utils';
import './features';

declare module 'node-mpv';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

if (store.get('ignore_ssl')) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    frame: false,
    height: 900,
    icon: getAssetPath('icon.png'),
    minHeight: 600,
    minWidth: 640,
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      devTools: true,
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: store.get('ignore_cors') ? false : undefined,
    },
    width: 1440,
  });

  electronLocalShortcut.register(mainWindow, 'Ctrl+Shift+I', () => {
    mainWindow?.webContents.openDevTools();
  });

  ipcMain.on('window-dev-tools', () => {
    mainWindow?.webContents.openDevTools();
  });

  ipcMain.on('window-maximize', () => {
    mainWindow?.maximize();
  });

  ipcMain.on('window-unmaximize', () => {
    mainWindow?.unmaximize();
  });

  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.on('app-restart', () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.on('global-media-keys-enable', () => {
    enableMediaKeys(mainWindow);
  });

  ipcMain.on('global-media-keys-disable', () => {
    disableMediaKeys();
  });

  const globalMediaKeysEnabled = store.get('global_media_hotkeys') as boolean;

  if (globalMediaKeysEnabled) {
    enableMediaKeys(mainWindow);
  }

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    // mainWindow?.webContents.send('renderer-player-quit');
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');

export const getMainWindow = () => {
  return mainWindow;
};

const MPV_BINARY_PATH = store.get('mpv_path') as string | undefined;
const MPV_PARAMETERS = store.get('mpv_parameters') as Array<string> | undefined;

const gaplessAudioParams = [
  '--gapless-audio=weak',
  '--gapless-audio=no',
  '--gapless-audio=yes',
  '--gapless-audio',
];

const prefetchPlaylistParams = [
  '--prefetch-playlist=no',
  '--prefetch-playlist=yes',
  '--prefetch-playlist',
];

const DEFAULT_MPV_PARAMETERS = () => {
  const parameters = [];
  if (!MPV_PARAMETERS?.some((param) => gaplessAudioParams.includes(param))) {
    parameters.push('--gapless-audio=weak');
  }

  if (!MPV_PARAMETERS?.some((param) => prefetchPlaylistParams.includes(param))) {
    parameters.push('--prefetch-playlist=yes');
  }

  return parameters;
};

export const mpv = new MpvAPI(
  {
    audio_only: true,
    auto_restart: true,
    binary: MPV_BINARY_PATH || '',
    time_update: 1,
  },
  MPV_PARAMETERS
    ? uniq([...DEFAULT_MPV_PARAMETERS(), ...MPV_PARAMETERS])
    : DEFAULT_MPV_PARAMETERS(),
);

mpv.start().catch((error) => {
  console.log('error starting mpv', error);
});

mpv.on('status', (status) => {
  if (status.property === 'playlist-pos') {
    if (status.value !== 0) {
      getMainWindow()?.webContents.send('renderer-player-auto-next');
    }
  }
});

// Automatically updates the play button when the player is playing
mpv.on('resumed', () => {
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

// Event output every interval set by time_update, used to update the current time
mpv.on('timeposition', (time: number) => {
  getMainWindow()?.webContents.send('renderer-player-current-time', time);
});

app.on('before-quit', () => {
  mpv.stop();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();

  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    mpv.stop();
    mainWindow = null;
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
