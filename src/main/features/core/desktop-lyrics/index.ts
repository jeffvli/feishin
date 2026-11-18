import type {
    DesktopLyricsLabels,
    DesktopLyricsSnapshot,
    DesktopLyricsState,
} from '/@/shared/types/desktop-lyrics';

import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron';
import { join } from 'path';
import { z } from 'zod';

import { store } from '../settings';

import log from '/@/main/logger';
import { resolveWindowBounds } from '/@/main/utils/window-bounds';
import {
    applyDesktopLyricsTime,
    desktopLyricsSettingsSchema,
    getDefaultDesktopLyricsSettings,
    getDesktopLyricsWindowSize,
    getEffectiveDesktopLyricsSettings,
    isNativeWayland,
} from '/@/shared/utils/desktop-lyrics';

const snapshotSchema = z.object({
    durationMs: z.number().finite().nonnegative().optional(),
    language: z.string(),
    lines: z.array(z.object({ startMs: z.number().finite(), text: z.string() })),
    offsetMs: z.number().finite(),
    playing: z.boolean(),
    romajiLines: z.array(z.object({ startMs: z.number().finite(), text: z.string() })).optional(),
    timestamp: z.number().finite(),
    title: z.string(),
    trackKey: z.string().nullable(),
    translationLines: z
        .array(z.object({ startMs: z.number().finite(), text: z.string() }))
        .optional(),
});
const timeSchema = z.object({ timestamp: z.number().finite(), trackKey: z.string().nullable() });
const labelsSchema = z.object({
    close: z.string(),
    title: z.string().optional(),
    unlock: z.string(),
});

export function initDesktopLyrics(
    getMainWindow: () => BrowserWindow | null,
    onStateChange: () => void,
) {
    let window: BrowserWindow | null = null;
    let settingsWindow: BrowserWindow | null = null;
    let settingsReady = false;
    let fontDialogWindow: BrowserWindow | null = null;
    let savePosition: (() => void) | undefined;
    const loadSurface = (target: BrowserWindow, query: Record<string, string>) => {
        if (process.env.ELECTRON_RENDERER_URL) {
            const url = new URL(process.env.ELECTRON_RENDERER_URL);
            for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
            return target.loadURL(url.toString());
        }
        return target.loadFile(join(__dirname, '../renderer/index.html'), { query });
    };
    let screenHeight = 1080;
    let snapshotRevision = 0;
    let snapshot: DesktopLyricsSnapshot | null = null;
    let labels: DesktopLyricsLabels = {
        close: 'Close desktop lyrics',
        unlock: 'Unlock desktop lyrics',
    };
    let state: DesktopLyricsState = {
        locked: false,
        open: false,
        revision: 0,
        wayland:
            process.platform === 'linux' &&
            isNativeWayland(
                app.commandLine.getSwitchValue('ozone-platform'),
                process.env.XDG_SESSION_TYPE ??
                    (process.env.WAYLAND_DISPLAY ? 'wayland' : undefined),
            ),
    };

    const getSnapshot = () => ({ revision: snapshotRevision, screenHeight, snapshot });
    const sendSnapshot = () => window?.webContents.send('desktop-lyrics-snapshot', getSnapshot());
    const updateState = () => {
        state = { ...state, revision: state.revision + 1 };
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('desktop-lyrics-state', state);
        }
        window?.webContents.send('desktop-lyrics-state', state);
        settingsWindow?.webContents.send('desktop-lyrics-state', state);
        onStateChange();
    };
    const dispose = () => {
        settingsWindow?.destroy();
        try {
            savePosition?.();
        } catch (error) {
            // Preserve disposal's existing handling of native getBounds failures.
            log.warn('Failed to save desktop lyrics position', error);
        }
        window?.destroy();
    };
    const rememberOpen = (open: boolean) => {
        try {
            store.set('desktop_lyrics_open', open);
        } catch (error) {
            log.warn('Failed to save desktop lyrics open preference', error);
        }
    };
    const close = () => {
        rememberOpen(false);
        dispose();
    };
    const keepOnTop = () => {
        if (!window || window.isDestroyed() || state.wayland) return;
        try {
            // Windows uses one topmost band; keep only the settings window in front while open.
            if (settingsWindow?.isVisible() && !settingsWindow.isMinimized()) {
                settingsWindow.moveTop();
                return;
            }
            // Windows floating is placed behind the taskbar; keep this overlay above it.
            window.setAlwaysOnTop(
                true,
                process.platform === 'darwin'
                    ? 'screen-saver'
                    : process.platform === 'win32'
                      ? 'pop-up-menu'
                      : undefined,
            );
            // Raise without activating the app or taking focus from the user's other window.
            if (window.isVisible() && process.platform !== 'linux') window.moveTop();
        } catch (error) {
            log.warn('Failed to maintain desktop lyrics always-on-top', error);
        }
    };
    const openSettings = async () => {
        if (settingsWindow) {
            if (settingsWindow.isMinimized()) settingsWindow.restore();
            if (settingsReady) {
                settingsWindow.show();
                settingsWindow.focus();
            }
            return;
        }
        const display = screen.getDisplayMatching(window!.getBounds());
        const target = new BrowserWindow({
            ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
            alwaysOnTop: !state.wayland,
            frame: false,
            fullscreenable: false,
            height: Math.min(720, display.workArea.height),
            minimizable: false,
            show: false,
            skipTaskbar: true,
            title: 'Feishin - Desktop lyrics settings',
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: join(__dirname, '../preload/index.js'),
                sandbox: true,
            },
            width: Math.min(780, display.workArea.width),
            x:
                display.workArea.x +
                Math.round((display.workArea.width - Math.min(780, display.workArea.width)) / 2),
            y:
                display.workArea.y +
                Math.round((display.workArea.height - Math.min(720, display.workArea.height)) / 2),
        });
        settingsWindow = target;
        settingsReady = false;
        target.on('blur', () => {
            // Keep pending saves and native font selection alive when dismissing the popup.
            if (fontDialogWindow !== target) target.hide();
        });
        target.on('page-title-updated', (event) => event.preventDefault());
        target.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        target.webContents.on('will-navigate', (event) => event.preventDefault());
        target.webContents.on('render-process-gone', (_event, details) => {
            log.error('Desktop lyrics settings renderer exited', details);
            target.destroy();
        });
        target.on('closed', () => {
            settingsWindow = null;
            settingsReady = false;
            keepOnTop();
        });
        try {
            if (!state.wayland) {
                target.setAlwaysOnTop(
                    true,
                    process.platform === 'darwin'
                        ? 'screen-saver'
                        : process.platform === 'win32'
                          ? 'pop-up-menu'
                          : undefined,
                    process.platform === 'darwin' ? 1 : undefined,
                );
            }
            await loadSurface(target, {
                desktopLyricsSettings: '1',
                language: snapshot?.language ?? 'en',
            });
            if (!target.isDestroyed()) {
                settingsReady = true;
                target.show();
            }
        } catch (error) {
            if (!target.isDestroyed()) target.destroy();
            log.error('Failed to open desktop lyrics settings', error);
            throw error;
        }
    };
    const setLocked = (locked: boolean) => {
        if (!window) {
            return state;
        }
        // Whole native window, including text, blank space and controls, ignores mouse events.
        try {
            window.setIgnoreMouseEvents(locked);
        } catch (error) {
            log.error('Failed to change desktop lyrics mouse passthrough', error);
            throw error;
        }
        // On Windows setFocusable also changes taskbar registration; passthrough is sufficient.
        if (process.platform === 'darwin') {
            try {
                window.setFocusable(!locked);
            } catch (error) {
                // Mouse passthrough already changed; still publish its actual state for recovery.
                log.warn('Failed to change desktop lyrics focusability', error);
            }
        }
        keepOnTop();
        state = { ...state, locked };
        updateState();
        try {
            store.set('desktop_lyrics_locked', locked);
        } catch (error) {
            // Publish the actual native state even if remembering it fails.
            log.warn('Failed to save desktop lyrics lock preference', error);
        }
        log.info('Desktop lyrics lock changed', { locked });
        return state;
    };
    const trusted = (sender: Electron.WebContents) =>
        sender === getMainWindow()?.webContents ||
        sender === window?.webContents ||
        sender === settingsWindow?.webContents;

    const getDefaultSettings = (height?: number) => {
        const display = screen.getPrimaryDisplay();
        return getDefaultDesktopLyricsSettings(
            height ?? (window ? screenHeight : display.size.height * display.scaleFactor),
        );
    };
    const getSettings = (height?: number) => {
        const parsed = desktopLyricsSettingsSchema.safeParse(store.get('desktop_lyrics_settings'));
        return parsed.success ? parsed.data : getDefaultSettings(height);
    };
    const resizeWindow = () => {
        if (!window) return;
        const bounds = window.getBounds();
        const display = screen.getDisplayMatching(bounds);
        const { workArea } = display;
        const { height, width } = getDesktopLyricsWindowSize(
            snapshot,
            getSettings(),
            workArea,
            display.size.height * display.scaleFactor,
        );
        if (width === bounds.width && height === bounds.height) return;
        try {
            if (state.wayland) {
                window.setSize(width, height);
            } else {
                window.setBounds({
                    height,
                    width,
                    x: Math.max(
                        workArea.x,
                        Math.min(
                            Math.round(bounds.x + (bounds.width - width) / 2),
                            workArea.x + workArea.width - width,
                        ),
                    ),
                    y: Math.max(
                        workArea.y,
                        Math.min(
                            Math.round(bounds.y + (bounds.height - height) / 2),
                            workArea.y + workArea.height - height,
                        ),
                    ),
                });
            }
        } catch (error) {
            log.warn('Failed to resize desktop lyrics window', error);
        }
    };
    const sendSettings = (settings: ReturnType<typeof getSettings>) => {
        getMainWindow()?.webContents.send('desktop-lyrics-settings-changed', settings);
        window?.webContents.send('desktop-lyrics-settings-changed', settings);
        settingsWindow?.webContents.send('desktop-lyrics-settings-changed', settings);
    };
    const saveSettings = (input: unknown) => {
        const settings = desktopLyricsSettingsSchema.parse(input);
        try {
            store.set('desktop_lyrics_settings', settings);
        } catch (error) {
            log.error('Failed to save desktop lyrics settings', error);
            throw error;
        }
        resizeWindow();
        sendSettings(settings);
        return settings;
    };
    ipcMain.handle('desktop-lyrics-settings', (event) => {
        if (!trusted(event.sender)) throw new Error('Invalid desktop lyrics sender');
        return getSettings();
    });
    ipcMain.handle('desktop-lyrics-settings-update', (event, input: unknown) => {
        if (
            event.sender !== getMainWindow()?.webContents &&
            event.sender !== settingsWindow?.webContents
        ) {
            throw new Error('Update settings from a settings window');
        }
        return saveSettings(input);
    });
    ipcMain.handle('desktop-lyrics-settings-reset', (event) => {
        if (
            event.sender !== getMainWindow()?.webContents &&
            event.sender !== settingsWindow?.webContents
        ) {
            throw new Error('Reset settings from a settings window');
        }
        return saveSettings(getDefaultSettings());
    });
    ipcMain.handle('desktop-lyrics-select-font', async (event) => {
        const target =
            event.sender === settingsWindow?.webContents ? settingsWindow : getMainWindow();
        if (!target || target.isDestroyed() || event.sender !== target.webContents) {
            throw new Error('Select fonts from a settings window');
        }
        if (fontDialogWindow) return null;
        fontDialogWindow = target;
        try {
            const { filePaths } = await dialog.showOpenDialog(target, {
                filters: [
                    {
                        extensions: ['ttc', 'ttf', 'otf', 'woff', 'woff2'],
                        name: 'ttc, ttf, otf, woff, woff2',
                    },
                ],
                properties: ['openFile'],
            });
            return filePaths[0] ?? null;
        } catch (error) {
            log.error('Failed to select desktop lyrics font', error);
            throw error;
        } finally {
            fontDialogWindow = null;
        }
    });
    ipcMain.handle('desktop-lyrics-open-settings', (event) => {
        if (event.sender !== window?.webContents || state.locked) {
            throw new Error('Cannot open desktop lyrics settings');
        }
        return openSettings();
    });
    ipcMain.handle('desktop-lyrics-layout-toggle', (event) => {
        if (event.sender !== window?.webContents || state.locked) {
            throw new Error('Cannot toggle desktop lyrics layout');
        }
        const settings = getSettings();
        return saveSettings({
            ...settings,
            layout: settings.layout === 'center' ? 'diagonal' : 'center',
        });
    });

    ipcMain.handle('desktop-lyrics-state', (event) => {
        if (!trusted(event.sender)) {
            throw new Error('Invalid desktop lyrics sender');
        }
        return state;
    });
    ipcMain.handle('desktop-lyrics-snapshot', (event) => {
        if (event.sender !== window?.webContents) {
            throw new Error('Invalid desktop lyrics sender');
        }
        return getSnapshot();
    });
    const open = async (input: unknown) => {
        labels = labelsSchema.parse(input);
        if (window) {
            onStateChange();
            return state;
        }
        const saved = state.wayland
            ? undefined
            : (store.get('desktop_lyrics_bounds') as Electron.Rectangle | undefined);
        const display =
            saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
                ? screen.getDisplayMatching(saved)
                : screen.getPrimaryDisplay();
        screenHeight = display.size.height * display.scaleFactor;
        const bounds = saved ? resolveWindowBounds(saved, display.workArea) : {};
        const { height, width } = getDesktopLyricsWindowSize(
            snapshot,
            getSettings(screenHeight),
            display.workArea,
            display.size.height * display.scaleFactor,
        );
        const lyricsWindow = new BrowserWindow({
            ...(bounds.x !== undefined && bounds.y !== undefined
                ? {
                      x: Math.max(
                          display.workArea.x,
                          Math.min(bounds.x, display.workArea.x + display.workArea.width - width),
                      ),
                      y: Math.max(
                          display.workArea.y,
                          Math.min(bounds.y, display.workArea.y + display.workArea.height - height),
                      ),
                  }
                : {}),
            ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
            alwaysOnTop: !state.wayland,
            backgroundColor: '#00000000',
            frame: false,
            fullscreenable: false,
            hasShadow: false,
            height,
            hiddenInMissionControl: process.platform === 'darwin',
            maximizable: false,
            minimizable: false,
            resizable: false,
            show: false,
            skipTaskbar: true,
            // Keep OBS window matching stable across language changes and startup restore.
            title: 'Feishin - Desktop lyrics',
            transparent: true,
            webPreferences: {
                backgroundThrottling: false,
                contextIsolation: true,
                nodeIntegration: false,
                preload: join(__dirname, '../preload/index.js'),
                sandbox: true,
            },
            width,
        });
        lyricsWindow.on('page-title-updated', (event) => event.preventDefault());
        if (process.platform === 'darwin') {
            lyricsWindow.excludedFromShownWindowsMenu = true;
        }
        const updateDisplay = () => {
            const currentDisplay = screen.getDisplayMatching(lyricsWindow.getBounds());
            const nextScreenHeight = currentDisplay.size.height * currentDisplay.scaleFactor;
            if (nextScreenHeight !== screenHeight) {
                screenHeight = nextScreenHeight;
                snapshotRevision += 1;
                resizeWindow();
                if (
                    !desktopLyricsSettingsSchema.safeParse(store.get('desktop_lyrics_settings'))
                        .success
                ) {
                    sendSettings(getSettings());
                }
                sendSnapshot();
            }
        };
        const displayMetricsChanged = () => {
            updateDisplay();
            resizeWindow();
        };
        screen.on('display-metrics-changed', displayMetricsChanged);
        let hoverTimer: ReturnType<typeof setInterval> | undefined;
        let topTimer: ReturnType<typeof setInterval> | undefined;
        let positionTimer: ReturnType<typeof setTimeout> | undefined;
        let pendingBounds: Electron.Rectangle | undefined = state.wayland
            ? undefined
            : lyricsWindow.getBounds();
        const flushPosition = () => {
            clearTimeout(positionTimer);
            positionTimer = undefined;
            if (state.wayland) return;
            const bounds = lyricsWindow.isDestroyed() ? pendingBounds : lyricsWindow.getBounds();
            pendingBounds = undefined;
            if (!bounds) return;
            try {
                store.set('desktop_lyrics_bounds', bounds);
            } catch (error) {
                log.warn('Failed to save desktop lyrics position', error);
            }
        };
        savePosition = flushPosition;
        window = lyricsWindow;
        sendSettings(getSettings(screenHeight));
        keepOnTop();
        lyricsWindow.on('show', keepOnTop);
        lyricsWindow.on('blur', keepOnTop);
        state = { ...state, open: true };
        if (state.wayland) {
            log.warn('Desktop lyrics: native Wayland cannot guarantee always-on-top');
        }
        lyricsWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        lyricsWindow.webContents.on('will-navigate', (navigation) => navigation.preventDefault());
        lyricsWindow.webContents.on('render-process-gone', (_event, details) => {
            log.error('Desktop lyrics renderer exited', details);
            dispose();
        });
        lyricsWindow.on('close', flushPosition);
        lyricsWindow.on('closed', () => {
            // destroy() skips close; flush the last move snapshot without reading a dead window.
            flushPosition();
            savePosition = undefined;
            screen.removeListener('display-metrics-changed', displayMetricsChanged);
            clearInterval(hoverTimer);
            clearInterval(topTimer);
            window = null;
            settingsWindow?.destroy();
            snapshot = null;
            snapshotRevision += 1;
            state = { ...state, locked: false, open: false };
            updateState();
            log.info('Desktop lyrics window closed');
        });
        lyricsWindow.on('move', () => {
            updateDisplay();
            if (!state.wayland) {
                pendingBounds = lyricsWindow.getBounds();
                clearTimeout(positionTimer);
                positionTimer = setTimeout(flushPosition, 300);
            }
        });
        try {
            // Apply before showing, so reopening a locked overlay never briefly intercepts clicks.
            setLocked(store.get('desktop_lyrics_locked') === true);
            await loadSurface(lyricsWindow, { desktopLyrics: '1' });
            if (!lyricsWindow.isDestroyed()) {
                rememberOpen(true);
                if (state.wayland) {
                    lyricsWindow.show();
                } else {
                    lyricsWindow.showInactive();
                }
                if (process.platform === 'win32') {
                    // Locked windows receive no blur when another topmost window covers them.
                    topTimer = setInterval(() => {
                        if (!lyricsWindow.isDestroyed() && lyricsWindow.isVisible()) keepOnTop();
                    }, 100);
                }
                if (!state.wayland) {
                    let previousHovered: boolean | undefined;
                    // Native drag regions suppress DOM mouse events, so use screen coordinates.
                    hoverTimer = setInterval(() => {
                        if (lyricsWindow.isDestroyed()) {
                            return;
                        }
                        const cursor = screen.getCursorScreenPoint();
                        const bounds = lyricsWindow.getBounds();
                        const hovered =
                            lyricsWindow.isVisible() &&
                            cursor.x >= bounds.x &&
                            cursor.x < bounds.x + bounds.width &&
                            cursor.y >= bounds.y &&
                            cursor.y < bounds.y + bounds.height;
                        if (hovered !== previousHovered) {
                            previousHovered = hovered;
                            lyricsWindow.webContents.send('desktop-lyrics-hover', hovered);
                        }
                    }, 150);
                }
                sendSnapshot();
                log.info('Desktop lyrics window opened');
            }
        } catch (error) {
            log.error('Failed to open desktop lyrics', error);
            if (!lyricsWindow.isDestroyed()) {
                lyricsWindow.destroy();
            }
            throw error;
        }
        return state;
    };
    ipcMain.handle('desktop-lyrics-open', (event, input: unknown) => {
        if (event.sender !== getMainWindow()?.webContents) {
            throw new Error('Invalid desktop lyrics sender');
        }
        return open(input);
    });
    ipcMain.handle('desktop-lyrics-restore', (event, input: unknown) => {
        if (event.sender !== getMainWindow()?.webContents) {
            throw new Error('Invalid desktop lyrics sender');
        }
        return store.get('desktop_lyrics_open') === true ? open(input) : state;
    });
    ipcMain.handle('desktop-lyrics-close', (event) => {
        if (!trusted(event.sender)) {
            throw new Error('Invalid desktop lyrics sender');
        }
        close();
        return state;
    });
    ipcMain.handle('desktop-lyrics-lock', (event, locked: unknown) => {
        if (!trusted(event.sender) || typeof locked !== 'boolean') {
            throw new Error('Invalid desktop lyrics lock');
        }
        // The click-through renderer cannot unlock itself; use the main window or tray.
        if (state.locked && event.sender === window?.webContents) {
            throw new Error('Unlock from the main window');
        }
        return setLocked(locked);
    });
    ipcMain.on('desktop-lyrics-publish', (event, input: unknown) => {
        if (event.sender !== getMainWindow()?.webContents || !window) {
            return;
        }
        const parsed = snapshotSchema.safeParse(input);
        if (!parsed.success) {
            log.warn('Invalid desktop lyrics snapshot');
            return;
        }
        snapshot = parsed.data;
        resizeWindow();
        snapshotRevision += 1;
        sendSnapshot();
    });
    ipcMain.handle('desktop-lyrics-offset', (event, input: unknown) => {
        if (event.sender !== window?.webContents || state.locked) {
            throw new Error('Adjust offset from the unlocked desktop lyrics window');
        }
        const update = z
            .object({ offsetMs: z.number().finite().int(), trackKey: z.string() })
            .strict()
            .parse(input);
        if (!snapshot?.trackKey || update.trackKey !== snapshot.trackKey) return;
        getMainWindow()?.webContents.send('desktop-lyrics-offset-request', update);
    });
    ipcMain.on('desktop-lyrics-time', (event, input: unknown) => {
        if (event.sender !== getMainWindow()?.webContents || !snapshot) {
            return;
        }
        const parsed = timeSchema.safeParse(input);
        if (!parsed.success) {
            return;
        }
        const next = applyDesktopLyricsTime(snapshot, parsed.data);
        if (next === snapshot) {
            return;
        }
        snapshot = next;
        snapshotRevision += 1;
        sendSnapshot();
    });
    app.on('before-quit', dispose);
    return {
        close,
        dispose,
        getFontPath: (pathname: string) => {
            const settings = getEffectiveDesktopLyricsSettings(getSettings());
            const font =
                pathname === '/primary'
                    ? settings.font
                    : pathname === '/translation'
                      ? settings.translationFont
                      : pathname === '/next'
                        ? settings.nextStyle.font
                        : pathname === '/next-translation'
                          ? settings.nextTranslationStyle.font
                          : null;
            return font?.type === 'custom' ? font.custom : null;
        },
        getLabels: () => labels,
        getState: () => state,
        setLocked,
    };
}
