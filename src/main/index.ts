import type { UpdateCheckResult } from 'electron-updater';

import { is } from '@electron-toolkit/utils';
import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    globalShortcut,
    ipcMain,
    Menu,
    nativeImage,
    nativeTheme,
    net,
    powerSaveBlocker,
    protocol,
    Rectangle,
    screen,
    shell,
    Tray,
} from 'electron';
import electronLocalShortcut from 'electron-localshortcut';
import log from 'electron-log/main';
import { AppImageUpdater, autoUpdater, MacUpdater, NsisUpdater } from 'electron-updater';
import { access, constants } from 'fs';
import path, { join } from 'path';
import semver from 'semver';

import packageJson from '../../package.json';
import { disableMediaKeys, enableMediaKeys } from './features/core/player/media-keys';
import { shutdownServer } from './features/core/remote';
import { store } from './features/core/settings';
import MenuBuilder, { MenuPlaybackState } from './menu';
import {
    autoUpdaterLogInterface,
    createLog,
    disableAutoUpdates,
    hotkeyToElectronAccelerator,
    isLinux,
    isMacOS,
    isWindows,
} from './utils';
import './features';

import { PlayerRepeat, PlayerStatus, PlayerType, TitleTheme } from '/@/shared/types/types';

const ALPHA_UPDATER_CONFIG: {
    bucket: string;
    channel: string;
    endpoint: string;
    provider: 's3';
} = {
    bucket: '',
    channel: 'alpha',
    endpoint: 'https://feishin-nightly-bucket.jeffvli.org',
    provider: 's3',
};

const GITHUB_UPDATER_CONFIG = {
    owner: 'jeffvli',
    provider: 'github' as const,
    repo: 'feishin',
};

type UpdaterInstance = AppImageUpdater | MacUpdater | NsisUpdater | typeof autoUpdater;

class AppUpdater {
    constructor() {
        const effectiveChannel = store.get('release_channel') as string;
        console.log('Effective update channel:', effectiveChannel);
        if (effectiveChannel === 'alpha') {
            checkAllChannelsAndGetBest().then(({ result, updater: updaterInstance }) => {
                updaterInstance.autoInstallOnAppQuit = true;
                updaterInstance.autoRunAppAfterInstall = true;
                if (isMacOS()) {
                    if (result?.isUpdateAvailable) {
                        getMainWindow()?.webContents.send(
                            'update-available',
                            result.updateInfo.version,
                        );
                    }
                } else {
                    updaterInstance.checkForUpdatesAndNotify();
                }
            });
            return;
        }

        configureAndGetUpdater();
        if (isMacOS()) {
            autoUpdater.autoDownload = false;
            autoUpdater
                .checkForUpdates()
                .then((result) => {
                    if (result?.isUpdateAvailable) {
                        getMainWindow()?.webContents.send(
                            'update-available',
                            result.updateInfo.version,
                        );
                    }
                })
                .catch((err) => console.error('Check for updates failed', err));
        } else {
            autoUpdater.checkForUpdatesAndNotify();
        }
    }
}

// When release channel is alpha, check alpha and latest for updates and return
// the updater + result for the newest version found (so alpha users can receive
// latest updates when they are newer than the current alpha).
async function checkAllChannelsAndGetBest(): Promise<{
    result: null | UpdateCheckResult;
    updater: UpdaterInstance;
}> {
    const currentVersion = packageJson.version;
    const candidates: Array<{
        channel: 'alpha' | 'beta' | 'latest';
        result: UpdateCheckResult;
        updater: UpdaterInstance;
    }> = [];

    const alphaUpdater = createAlphaUpdaterInstance();
    alphaUpdater.logger = autoUpdaterLogInterface;
    alphaUpdater.channel = ALPHA_UPDATER_CONFIG.channel;
    alphaUpdater.allowPrerelease = true;
    alphaUpdater.disableDifferentialDownload = true;
    alphaUpdater.allowDowngrade = true;

    try {
        console.log('Checking for updates on alpha channel');
        const alphaResult = await alphaUpdater.checkForUpdates();
        if (
            alphaResult?.updateInfo?.version &&
            alphaResult.isUpdateAvailable &&
            semver.valid(alphaResult.updateInfo.version) &&
            semver.gt(alphaResult.updateInfo.version, currentVersion)
        ) {
            candidates.push({ channel: 'alpha', result: alphaResult, updater: alphaUpdater });
        }
    } catch (e) {
        log.warn('Alpha channel check failed', e);
    }

    try {
        autoUpdater.setFeedURL(GITHUB_UPDATER_CONFIG);
        configureAutoUpdaterForChannel('latest');
        console.log('Checking for updates on latest channel (GitHub)');
        const latestResult = await autoUpdater.checkForUpdates();
        if (
            latestResult?.updateInfo?.version &&
            latestResult.isUpdateAvailable &&
            semver.valid(latestResult.updateInfo.version) &&
            semver.gt(latestResult.updateInfo.version, currentVersion)
        ) {
            candidates.push({ channel: 'latest', result: latestResult, updater: autoUpdater });
        }
    } catch (e) {
        log.warn('Latest channel check failed', e);
    }

    if (candidates.length === 0) {
        return { result: null, updater: alphaUpdater };
    }

    const best = candidates.reduce((a, b) =>
        semver.gt(a.result.updateInfo.version, b.result.updateInfo.version) ? a : b,
    );

    if (best.channel === 'latest') {
        configureAutoUpdaterForChannel('latest');
    }

    return { result: best.result, updater: best.updater };
}

function configureAndGetUpdater(): UpdaterInstance {
    const isBetaVersion = packageJson.version.includes('-beta');
    const isAlphaVersion = packageJson.version.includes('-alpha');
    let releaseChannel = store.get('release_channel');
    const isNotConfigured = !releaseChannel;

    console.log('Release channel:', releaseChannel);
    console.log('Is beta version:', isBetaVersion);
    console.log('Is alpha version:', isAlphaVersion);
    console.log('Is not configured:', isNotConfigured);

    if (isNotConfigured) {
        console.log('Release channel not configured, setting default channel');
        const defaultChannel = isAlphaVersion ? 'alpha' : isBetaVersion ? 'beta' : 'latest';
        store.set('release_channel', defaultChannel);
        releaseChannel = defaultChannel;
    }

    const effectiveChannel = store.get('release_channel') as string;

    if (effectiveChannel === 'alpha') {
        const updater = createAlphaUpdaterInstance();
        log.transports.file.level = 'info';
        updater.logger = autoUpdaterLogInterface;
        updater.channel = ALPHA_UPDATER_CONFIG.channel;
        updater.allowPrerelease = true;
        updater.disableDifferentialDownload = true;
        updater.allowDowngrade = true;
        updater.autoInstallOnAppQuit = true;
        updater.autoRunAppAfterInstall = true;
        return updater;
    }

    log.transports.file.level = 'info';
    autoUpdater.logger = autoUpdaterLogInterface;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;

    if (effectiveChannel === 'beta') {
        autoUpdater.channel = 'beta';
        autoUpdater.allowDowngrade = true;
        autoUpdater.allowPrerelease = true;
        autoUpdater.disableDifferentialDownload = true;
    } else {
        autoUpdater.channel = 'latest';
        autoUpdater.allowPrerelease = false;
    }

    return autoUpdater;
}

/**
 * Configures the global autoUpdater for a specific GitHub channel (beta or latest).
 * Used when checking multiple channels or when the winning channel is beta/latest.
 */
function configureAutoUpdaterForChannel(channel: 'beta' | 'latest'): void {
    log.transports.file.level = 'info';
    autoUpdater.logger = autoUpdaterLogInterface;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;
    if (channel === 'beta') {
        autoUpdater.channel = 'beta';
        autoUpdater.allowDowngrade = true;
        autoUpdater.allowPrerelease = true;
        autoUpdater.disableDifferentialDownload = true;
    } else {
        autoUpdater.channel = 'latest';
        autoUpdater.allowPrerelease = false;
    }
}

function createAlphaUpdaterInstance(): AppImageUpdater | MacUpdater | NsisUpdater {
    if (isMacOS()) {
        return new MacUpdater(ALPHA_UPDATER_CONFIG);
    }

    if (isLinux()) {
        return new AppImageUpdater(ALPHA_UPDATER_CONFIG);
    }

    return new NsisUpdater(ALPHA_UPDATER_CONFIG);
}

protocol.registerSchemesAsPrivileged([{ privileges: { bypassCSP: true }, scheme: 'feishin' }]);

process.on('uncaughtException', (error: any) => {
    console.error('Error in main process', error);
});

if (store.get('ignore_ssl')) {
    app.commandLine.appendSwitch('ignore-certificate-errors');
}

// From https://github.com/tutao/tutanota/commit/92c6ed27625fcf367f0fbcc755d83d7ff8fde94b
if (isLinux() && !process.argv.some((a) => a.startsWith('--password-store='))) {
    const passwordStore = store.get('password_store', 'gnome-libsecret') as string;
    app.commandLine.appendSwitch('password-store', passwordStore);
}

let mainWindow: BrowserWindow | null = null;
let tray: null | Tray = null;
let exitFromTray = false;
let forceQuit = false;
let powerSaveBlockerId: null | number = null;
let menuBuilder: MenuBuilder | null = null;
let currentPlaybackStatus: PlayerStatus = PlayerStatus.PAUSED;
let currentPrivateMode = false;
let currentRepeatMode: PlayerRepeat = PlayerRepeat.NONE;
let currentSidebarCollapsed = false;
let currentShuffleEnabled = false;
let playbackMenuAccelerators: MenuPlaybackState['accelerators'] = {};

if (process.env.NODE_ENV === 'production') {
    import('source-map-support').then((sourceMapSupport) => {
        sourceMapSupport.install();
    });
}

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
    import('electron-debug').then((electronDebug) => {
        electronDebug.default();
    });
}

const installExtensions = async () => {
    import('electron-devtools-installer').then((installer) => {
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
        const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

        installer
            .installExtension(
                extensions.map((name) => installer[name]),
                { forceDownload },
            )
            .then((installedExtensions) => {
                createLog({
                    message: `Installed extension: ${installedExtensions}`,
                    type: 'info',
                });
            })
            .catch(() => {
                // Ignore
            });
    });
};

const userDataPath = app.getPath('userData');

if (isDevelopment) {
    const devUserDataPath = `${userDataPath}-dev`;
    app.setPath('userData', devUserDataPath);
}

const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

export const getMainWindow = () => {
    return mainWindow;
};

const rebuildMainMenu = () => {
    if (!menuBuilder || !mainWindow) return;

    menuBuilder.buildMenu({
        accelerators: playbackMenuAccelerators,
        playbackStatus: currentPlaybackStatus,
        privateMode: currentPrivateMode,
        repeatMode: currentRepeatMode,
        shuffleEnabled: currentShuffleEnabled,
        sidebarCollapsed: currentSidebarCollapsed,
    });

    if (process.platform !== 'darwin') {
        Menu.setApplicationMenu(null);
    }
};

export const sendToastToRenderer = ({
    message,
    type,
}: {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
}) => {
    getMainWindow()?.webContents.send('toast-from-main', {
        message,
        type,
    });
};

const createWinThumbarButtons = () => {
    if (isWindows()) {
        getMainWindow()?.setThumbarButtons([
            {
                click: () => getMainWindow()?.webContents.send('renderer-player-previous'),
                icon: nativeImage.createFromPath(getAssetPath('skip-previous.png')),
                tooltip: 'Previous Track',
            },
            {
                click: () => getMainWindow()?.webContents.send('renderer-player-play-pause'),
                icon: nativeImage.createFromPath(getAssetPath('play-circle.png')),
                tooltip: 'Play/Pause',
            },
            {
                click: () => getMainWindow()?.webContents.send('renderer-player-next'),
                icon: nativeImage.createFromPath(getAssetPath('skip-next.png')),
                tooltip: 'Next Track',
            },
        ]);
    }
};

const createTray = () => {
    let trayIcon: Electron.NativeImage | string;

    if (isMacOS()) {
        const iconPath = getAssetPath('icons/IconTemplate.png');
        const icon = nativeImage.createFromPath(iconPath);
        icon.setTemplateImage(true);
        trayIcon = icon;
    } else if (isLinux()) {
        trayIcon = getAssetPath('icons/icon.png');
    } else {
        trayIcon = getAssetPath('icons/icon.ico');
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-play-pause');
            },
            label: 'Play/Pause',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-next');
            },
            label: 'Next Track',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-previous');
            },
            label: 'Previous Track',
        },
        {
            click: () => {
                getMainWindow()?.webContents.send('renderer-player-stop');
            },
            label: 'Stop',
        },
        {
            type: 'separator',
        },
        {
            click: () => {
                if (mainWindow === null) createWindow(false);
                else {
                    mainWindow.show();
                    createWinThumbarButtons();
                }
            },
            label: 'Open main window',
        },
        {
            click: () => {
                exitFromTray = true;
                app.quit();
            },
            label: 'Quit',
        },
    ]);

    if (!isMacOS()) {
        tray.on('click', () => {
            if (store.get('window_minimize_to_tray')) {
                if (mainWindow?.isVisible()) {
                    mainWindow?.hide();
                } else {
                    mainWindow?.show();
                    createWinThumbarButtons();
                }
            } else {
                mainWindow?.show();
                createWinThumbarButtons();
            }
        });
    }

    tray.setToolTip('Feishin');
    tray.setContextMenu(contextMenu);
};

async function createWindow(first = true): Promise<void> {
    if (isDevelopment) {
        await installExtensions().catch(console.log);
    }

    const nativeFrame = store.get('window_window_bar_style', 'linux') === 'linux';
    store.set('window_has_frame', nativeFrame);

    const nativeFrameConfig: Record<string, BrowserWindowConstructorOptions> = {
        linux: {
            autoHideMenuBar: true,
            frame: true,
        },
        macOS: {
            autoHideMenuBar: true,
            frame: true,
            titleBarStyle: 'default',
            trafficLightPosition: { x: 10, y: 10 },
        },
        windows: {
            autoHideMenuBar: true,
            frame: true,
        },
    };

    // Create the browser window.
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        frame: false,
        height: 900,
        icon: isWindows() ? getAssetPath('icons/icon.ico') : getAssetPath('icons/icon.png'),
        minHeight: 120,
        minWidth: 480,
        show: false,
        webPreferences: {
            allowRunningInsecureContent: !!store.get('ignore_ssl'),
            backgroundThrottling: false,
            contextIsolation: true,
            devTools: true,
            nodeIntegration: true,
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            webSecurity: !store.get('ignore_cors'),
        },
        width: 1440,
        ...(nativeFrame && isLinux() && nativeFrameConfig.linux),
        ...(nativeFrame && isMacOS() && nativeFrameConfig.macOS),
        ...(nativeFrame && isWindows() && nativeFrameConfig.windows),
    });

    // From https://github.com/electron/electron/issues/526#issuecomment-1663959513
    const bounds = store.get('bounds') as Rectangle | undefined;
    if (bounds) {
        const screenArea = screen.getDisplayMatching(bounds).workArea;
        if (
            bounds.x > screenArea.x + screenArea.width ||
            bounds.x < screenArea.x ||
            bounds.y < screenArea.y ||
            bounds.y > screenArea.y + screenArea.height
        ) {
            if (bounds.width < screenArea.width && bounds.height < screenArea.height) {
                mainWindow.setBounds({ height: bounds.height, width: bounds.width });
            } else {
                mainWindow.setBounds({ height: 900, width: 1440 });
            }
        } else {
            mainWindow.setBounds(bounds);
        }
    }

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

    ipcMain.on('window-quit', () => {
        shutdownServer();
        mainWindow?.close();
        app.exit();
    });

    ipcMain.handle('window-clear-cache', async () => {
        return mainWindow?.webContents.session.clearCache();
    });

    ipcMain.handle(
        'app-check-for-updates',
        async (): Promise<{ updateAvailable: boolean; version?: string }> => {
            if (disableAutoUpdates()) {
                console.log('Auto updates are disabled');
                return { updateAvailable: false };
            }

            try {
                console.log('Checking for updates');
                const effectiveChannel = store.get('release_channel') as string;
                let result: null | UpdateCheckResult;
                let updater: UpdaterInstance;

                if (effectiveChannel === 'alpha') {
                    const best = await checkAllChannelsAndGetBest();
                    result = best.result;
                    updater = best.updater;
                } else {
                    updater = configureAndGetUpdater();
                    result = await updater.checkForUpdates();
                }

                const updateAvailable = result?.isUpdateAvailable ?? false;
                console.log('Update available:', updateAvailable);
                if (updateAvailable && store.get('disable_auto_updates') !== true) {
                    if (isMacOS()) {
                        getMainWindow()?.webContents.send(
                            'update-available',
                            result?.updateInfo?.version,
                        );
                    } else {
                        console.log('Downloading update');
                        updater.downloadUpdate();
                    }
                }

                return {
                    updateAvailable,
                    version: result?.updateInfo?.version,
                };
            } catch {
                console.log('Error checking for updates');
                return { updateAvailable: false };
            }
        },
    );

    ipcMain.on('app-restart', () => {
        // Fix for .AppImage
        if (process.env.APPIMAGE) {
            app.exit();
            app.relaunch({
                args: process.argv.slice(1).concat(['--appimage-extract-and-run']),
                execPath: process.env.APPIMAGE,
            });
            app.exit(0);
        } else {
            app.relaunch();
            app.exit(0);
        }
    });

    ipcMain.on('global-media-keys-enable', () => {
        enableMediaKeys(mainWindow);
    });

    ipcMain.on('global-media-keys-disable', () => {
        disableMediaKeys();
    });

    ipcMain.on('download-url', (_event, url: string) => {
        mainWindow?.webContents.downloadURL(url);
    });

    const globalMediaKeysEnabled = store.get('global_media_hotkeys', true) as boolean;

    if (globalMediaKeysEnabled) {
        enableMediaKeys(mainWindow);
    }

    const startWindowMinimized = store.get('window_start_minimized', false) as boolean;

    mainWindow.on('ready-to-show', () => {
        // mainWindow.show()

        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }

        if (!first || !startWindowMinimized) {
            const maximized = store.get('maximized');
            const fullScreen = store.get('fullscreen');

            if (maximized) {
                mainWindow.maximize();
            }
            if (fullScreen) {
                mainWindow.setFullScreen(true);
            }

            mainWindow.show();
            createWinThumbarButtons();
        }
    });

    mainWindow.on('closed', () => {
        ipcMain.removeHandler('window-clear-cache');
        ipcMain.removeHandler('app-check-for-updates');
        mainWindow = null;
    });

    mainWindow.on('close', (event) => {
        store.set('bounds', mainWindow?.getNormalBounds());
        store.set('maximized', mainWindow?.isMaximized());
        store.set('fullscreen', mainWindow?.isFullScreen());

        if (!exitFromTray && store.get('window_exit_to_tray')) {
            event.preventDefault();
            mainWindow?.hide();
        }

        if (forceQuit) {
            app.exit();
        }
    });

    (mainWindow as any).on('minimize', (event: any) => {
        if (store.get('window_minimize_to_tray') === true) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    if (isWindows()) {
        app.setAppUserModelId('org.jeffvli.feishin');
    }

    if (isMacOS()) {
        app.on('before-quit', () => {
            forceQuit = true;
        });
    }

    menuBuilder = new MenuBuilder(mainWindow);
    rebuildMainMenu();

    // Open URLs in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    if (!disableAutoUpdates() && store.get('disable_auto_updates') !== true) {
        new AppUpdater();
    }

    const theme = store.get('theme') as TitleTheme | undefined;
    nativeTheme.themeSource = theme || 'dark';

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

// Only allow hardware media key handling if:
// 1. The "Enable Media Session" setting is enabled
// 2. The playback type is WEB (mpv not supported)
// 3. The platform is not Linux (because we are using mpris instead)
const enableMediaSession = store.get('mediaSession', false) as boolean;
const playbackType = store.get('playbackType', PlayerType.WEB) as PlayerType;
const shouldDisableMediaFeatures =
    isLinux() || !enableMediaSession || playbackType !== PlayerType.WEB;

const chromiumDisabledFeatures: string[] = [];
// Fractional scaling on Wayland: https://github.com/jeffvli/feishin/issues/1271#issuecomment-4063326712
if (isLinux()) {
    chromiumDisabledFeatures.push('WaylandFractionalScaleV1');
}
if (shouldDisableMediaFeatures) {
    chromiumDisabledFeatures.push('HardwareMediaKeyHandling', 'MediaSessionService');
}

if (chromiumDisabledFeatures.length > 0) {
    app.commandLine.appendSwitch('disable-features', chromiumDisabledFeatures.join(','));
}

// https://github.com/electron/electron/issues/46538#issuecomment-2808806722
app.commandLine.appendSwitch('gtk-version', '3');

// Enable garbage collection API
app.commandLine.appendSwitch('js-flags', '--expose-gc');

// Must duplicate with the one in renderer process settings.store.ts
enum BindingActions {
    GLOBAL_SEARCH = 'globalSearch',
    LOCAL_SEARCH = 'localSearch',
    MUTE = 'volumeMute',
    NEXT = 'next',
    PAUSE = 'pause',
    PLAY = 'play',
    PLAY_PAUSE = 'playPause',
    PREVIOUS = 'previous',
    SHUFFLE = 'toggleShuffle',
    SKIP_BACKWARD = 'skipBackward',
    SKIP_FORWARD = 'skipForward',
    STOP = 'stop',
    TOGGLE_FULLSCREEN_PLAYER = 'toggleFullscreenPlayer',
    TOGGLE_QUEUE = 'toggleQueue',
    TOGGLE_REPEAT = 'toggleRepeat',
    VOLUME_DOWN = 'volumeDown',
    VOLUME_UP = 'volumeUp',
}

const getMenuAccelerator = (
    data: Record<BindingActions, { allowGlobal: boolean; hotkey: string; isGlobal: boolean }>,
    action: BindingActions,
) => {
    const hotkey = data[action]?.hotkey;

    if (!hotkey) return undefined;

    return hotkeyToElectronAccelerator(hotkey);
};

const HOTKEY_ACTIONS: Record<BindingActions, () => void> = {
    [BindingActions.GLOBAL_SEARCH]: () => {},
    [BindingActions.LOCAL_SEARCH]: () => {},
    [BindingActions.MUTE]: () => getMainWindow()?.webContents.send('renderer-player-volume-mute'),
    [BindingActions.NEXT]: () => getMainWindow()?.webContents.send('renderer-player-next'),
    [BindingActions.PAUSE]: () => getMainWindow()?.webContents.send('renderer-player-pause'),
    [BindingActions.PLAY]: () => getMainWindow()?.webContents.send('renderer-player-play'),
    [BindingActions.PLAY_PAUSE]: () =>
        getMainWindow()?.webContents.send('renderer-player-play-pause'),
    [BindingActions.PREVIOUS]: () => getMainWindow()?.webContents.send('renderer-player-previous'),
    [BindingActions.SHUFFLE]: () =>
        getMainWindow()?.webContents.send('renderer-player-toggle-shuffle'),
    [BindingActions.SKIP_BACKWARD]: () =>
        getMainWindow()?.webContents.send('renderer-player-skip-backward'),
    [BindingActions.SKIP_FORWARD]: () =>
        getMainWindow()?.webContents.send('renderer-player-skip-forward'),
    [BindingActions.STOP]: () => getMainWindow()?.webContents.send('renderer-player-stop'),
    [BindingActions.TOGGLE_FULLSCREEN_PLAYER]: () => {},
    [BindingActions.TOGGLE_QUEUE]: () => {},
    [BindingActions.TOGGLE_REPEAT]: () =>
        getMainWindow()?.webContents.send('renderer-player-toggle-repeat'),
    [BindingActions.VOLUME_DOWN]: () =>
        getMainWindow()?.webContents.send('renderer-player-volume-down'),
    [BindingActions.VOLUME_UP]: () =>
        getMainWindow()?.webContents.send('renderer-player-volume-up'),
};

ipcMain.on(
    'set-global-shortcuts',
    (
        _event,
        data: Record<BindingActions, { allowGlobal: boolean; hotkey: string; isGlobal: boolean }>,
    ) => {
        // Since we're not tracking the previous shortcuts, we need to unregister all of them
        globalShortcut.unregisterAll();

        for (const shortcut of Object.keys(data)) {
            const isGlobalHotkey = data[shortcut as BindingActions].isGlobal;
            const isValidHotkey =
                data[shortcut as BindingActions].hotkey &&
                data[shortcut as BindingActions].hotkey !== '';

            if (isGlobalHotkey && isValidHotkey) {
                const accelerator = hotkeyToElectronAccelerator(
                    data[shortcut as BindingActions].hotkey,
                );

                globalShortcut.register(accelerator, () => {
                    HOTKEY_ACTIONS[shortcut as BindingActions]();
                });
            }
        }

        playbackMenuAccelerators = {
            next: getMenuAccelerator(data, BindingActions.NEXT),
            playPause:
                getMenuAccelerator(data, BindingActions.PLAY_PAUSE) ||
                getMenuAccelerator(data, BindingActions.PLAY) ||
                getMenuAccelerator(data, BindingActions.PAUSE),
            previous: getMenuAccelerator(data, BindingActions.PREVIOUS),
            repeat: getMenuAccelerator(data, BindingActions.TOGGLE_REPEAT),
            seekBackward: getMenuAccelerator(data, BindingActions.SKIP_BACKWARD),
            seekForward: getMenuAccelerator(data, BindingActions.SKIP_FORWARD),
            shuffle: getMenuAccelerator(data, BindingActions.SHUFFLE),
            stop: getMenuAccelerator(data, BindingActions.STOP),
            volumeDown: getMenuAccelerator(data, BindingActions.VOLUME_DOWN),
            volumeUp: getMenuAccelerator(data, BindingActions.VOLUME_UP),
        };

        if (isMacOS()) {
            rebuildMainMenu();
        }

        const globalMediaKeysEnabled = store.get('global_media_hotkeys', true) as boolean;

        if (globalMediaKeysEnabled) {
            enableMediaKeys(mainWindow);
        }
    },
);

ipcMain.on(
    'logger',
    (
        _event,
        data: {
            message: string;
            type: 'debug' | 'error' | 'info' | 'success' | 'verbose' | 'warning';
        },
    ) => {
        createLog(data);
    },
);

ipcMain.handle('power-save-blocker-start', () => {
    if (powerSaveBlockerId !== null) {
        return powerSaveBlockerId;
    }

    powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
    return powerSaveBlockerId;
});

ipcMain.handle('power-save-blocker-stop', () => {
    if (powerSaveBlockerId !== null) {
        const stopped = powerSaveBlocker.stop(powerSaveBlockerId);
        powerSaveBlockerId = null;
        return stopped;
    }
    return false;
});

ipcMain.handle('power-save-blocker-is-started', () => {
    return powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId);
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (isMacOS()) {
        mainWindow = null;
    } else {
        app.quit();
    }
});

const FONT_HEADERS = [
    'font/collection',
    'font/otf',
    'font/sfnt',
    'font/ttf',
    'font/woff',
    'font/woff2',
];

const singleInstance = isDevelopment ? true : app.requestSingleInstanceLock();

if (!singleInstance) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            } else if (!mainWindow.isVisible()) {
                mainWindow.show();
            }

            mainWindow.focus();
        }
    });

    app.whenReady()
        .then(() => {
            protocol.handle('feishin', async (request) => {
                const filePath = `file:${request.url.slice('feishin:'.length)}`;
                const response = await net.fetch(filePath);
                const contentType = response.headers.get('content-type');

                if (!contentType || !FONT_HEADERS.includes(contentType)) {
                    getMainWindow()?.webContents.send('custom-font-error', filePath);

                    return new Response(null, {
                        status: 403,
                        statusText: 'Forbidden',
                    });
                }

                return response;
            });

            createWindow();
            if (store.get('window_enable_tray', true)) {
                createTray();
            }
            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (mainWindow === null) createWindow(false);
                else if (!mainWindow.isVisible()) {
                    mainWindow.show();
                    createWinThumbarButtons();
                }
            });
        })
        .catch(console.log);
}

// Register 'open-item' handler globally, ensuring it is only registered once
if (!ipcMain.eventNames().includes('open-item')) {
    ipcMain.handle('open-item', async (_event, path: string) => {
        return new Promise<void>((resolve, reject) => {
            access(path, constants.F_OK, (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                shell.showItemInFolder(path);
                resolve();
            });
        });
    });
}

// Register 'open-application-directory' handler globally, ensuring it is only registered once
if (!ipcMain.eventNames().includes('open-application-directory')) {
    ipcMain.handle('open-application-directory', async () => {
        const userDataPath = app.getPath('userData');
        shell.openPath(userDataPath);
    });
}

ipcMain.on('update-playback', (_event, status: PlayerStatus) => {
    currentPlaybackStatus = status;

    if (!isMacOS()) return;

    rebuildMainMenu();
});

ipcMain.on('update-repeat', (_event, repeat: PlayerRepeat) => {
    currentRepeatMode = repeat;

    if (!isMacOS()) return;

    rebuildMainMenu();
});

ipcMain.on('update-shuffle', (_event, shuffle: boolean) => {
    currentShuffleEnabled = shuffle;

    if (!isMacOS()) return;

    rebuildMainMenu();
});

ipcMain.on('update-private-mode', (_event, privateMode: boolean) => {
    currentPrivateMode = privateMode;

    if (!isMacOS()) return;

    rebuildMainMenu();
});

ipcMain.on('update-sidebar-collapsed', (_event, collapsedSidebar: boolean) => {
    currentSidebarCollapsed = collapsedSidebar;

    if (!isMacOS()) return;

    rebuildMainMenu();
});
