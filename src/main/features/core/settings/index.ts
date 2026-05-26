import type { TitleTheme } from '/@/shared/types/types';
import type { FSWatcher } from 'fs';

import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    nativeTheme,
    OpenDialogOptions,
    safeStorage,
    shell,
} from 'electron';
import Store from 'electron-store';
import { promises as fs, watch as fsWatch } from 'fs';
import path from 'path';

const getFrame = () => {
    const isWindows = process.platform === 'win32';
    const isMacOS = process.platform === 'darwin';

    if (isWindows) {
        return 'windows';
    }

    if (isMacOS) {
        return 'macOS';
    }

    return 'linux';
};

const isDevelopment = process.env.NODE_ENV === 'development';

const defaultUserDataPath = app.getPath('userData');
const storePath = isDevelopment
    ? path.normalize(`${defaultUserDataPath}-dev`)
    : path.normalize(defaultUserDataPath);

const CUSTOM_CSS_FILENAME = 'custom.css';
const customCssPath = path.join(storePath, CUSTOM_CSS_FILENAME);
let customCssWatcher: FSWatcher | null = null;
let customCssDebounce: NodeJS.Timeout | null = null;

const readCustomCss = async (): Promise<{ content: string; exists: boolean }> => {
    try {
        const content = await fs.readFile(customCssPath, 'utf8');
        return { content, exists: true };
    } catch (error) {
        const fsError = error as NodeJS.ErrnoException;
        if (fsError.code === 'ENOENT') {
            return { content: '', exists: false };
        }

        console.error('Failed to read custom css file', error);
        return { content: '', exists: false };
    }
};

const notifyCustomCssUpdate = async () => {
    const { content, exists } = await readCustomCss();
    BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('custom-css-updated', {
            content,
            exists,
            path: customCssPath,
        });
    });
};

const scheduleCustomCssUpdate = () => {
    if (customCssDebounce) {
        clearTimeout(customCssDebounce);
    }

    customCssDebounce = setTimeout(() => {
        notifyCustomCssUpdate().catch((error) => {
            console.error('Failed to broadcast custom css update', error);
        });
    }, 100);
};

const startCustomCssWatcher = async () => {
    if (customCssWatcher) return;

    try {
        await fs.mkdir(storePath, { recursive: true });
        customCssWatcher = fsWatch(storePath, (eventType, filename) => {
            if (!filename) return;
            if (filename.toString() !== CUSTOM_CSS_FILENAME) return;

            if (eventType === 'change' || eventType === 'rename') {
                scheduleCustomCssUpdate();
            }
        });
    } catch (error) {
        console.error('Failed to watch custom css file', error);
    }
};

export const store = new Store<any>({
    beforeEachMigration: (_store, context) => {
        console.log(`settings migrate from ${context.fromVersion} → ${context.toVersion}`);
    },
    cwd: storePath,
    defaults: {
        disable_auto_updates: false,
        enableNeteaseTranslation: false,
        global_media_hotkeys: true,
        lyrics: ['NetEase', 'lrclib.net'],
        mediaSession: false,
        playbackType: 'web',
        should_prompt_accessibility: true,
        shown_accessibility_warning: false,
        visualizer_system_audio_consent_granted: false,
        window_enable_tray: true,
        window_exit_to_tray: false,
        window_minimize_to_tray: false,
        window_start_minimized: false,
        window_window_bar_style: getFrame(),
    },
    migrations: {
        '>=0.21.2': (store) => {
            store.set('window_bar_style', 'linux');
        },
        '>=1.0.0': (store) => {
            store.clear();
        },
    },
});

ipcMain.handle('settings-get', (_event, data: { property: string }) => {
    return store.get(`${data.property}`);
});

ipcMain.on('settings-set', (__event, data: { property: string; value: any }) => {
    if (data.value === undefined) {
        store.delete(data.property);
    } else {
        store.set(data.property, data.value);
    }
});

ipcMain.handle('password-get', (_event, server: string): null | string => {
    if (safeStorage.isEncryptionAvailable()) {
        const servers = store.get('server') as Record<string, string> | undefined;

        if (!servers) {
            return null;
        }

        const encrypted = servers[server];
        if (!encrypted) return null;

        const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'hex'));
        return decrypted;
    }

    return null;
});

ipcMain.on('password-remove', (_event, server: string) => {
    const passwords = store.get('server', {}) as Record<string, string>;
    if (server in passwords) {
        delete passwords[server];
    }
    store.set({ server: passwords });
});

ipcMain.handle('password-set', (_event, password: string, server: string) => {
    if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(password);
        const passwords = store.get('server', {}) as Record<string, string>;
        passwords[server] = encrypted.toString('hex');
        store.set({ server: passwords });

        return true;
    }
    return false;
});

ipcMain.on('theme-set', (_event, theme: TitleTheme) => {
    store.set('theme', theme);
    nativeTheme.themeSource = theme;
});

ipcMain.handle('open-file-selector', async (_event, options: OpenDialogOptions) => {
    const result = await dialog.showOpenDialog({
        ...options,
        properties: ['openFile'],
    });

    return result.filePaths[0] || null;
});

ipcMain.handle('custom-css-get', async () => {
    const { content, exists } = await readCustomCss();
    return {
        content,
        exists,
        path: customCssPath,
    };
});

ipcMain.handle('custom-css-save', async (_event, data: { content: string }) => {
    const content = typeof data?.content === 'string' ? data.content : '';
    await fs.mkdir(storePath, { recursive: true });
    await fs.writeFile(customCssPath, content, 'utf8');
    await notifyCustomCssUpdate();
    return true;
});

ipcMain.handle('custom-css-open-folder', async () => {
    await fs.mkdir(storePath, { recursive: true });
    await shell.openPath(storePath);
    return true;
});

app.whenReady()
    .then(() => startCustomCssWatcher())
    .catch((error) => console.error('Failed to start custom css watcher', error));

app.on('before-quit', () => {
    if (customCssWatcher) {
        customCssWatcher.close();
        customCssWatcher = null;
    }

    if (customCssDebounce) {
        clearTimeout(customCssDebounce);
        customCssDebounce = null;
    }
});
