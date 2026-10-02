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
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'path';

import log from '/@/main/logger';

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

        log.error('Failed to read custom css file', error);
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
            log.error('Failed to broadcast custom css update', error);
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
        log.error('Failed to watch custom css file', error);
    }
};

export const store = new Store<any>({
    beforeEachMigration: (_store, context) => {
        log.info(`settings migrate from ${context.fromVersion} → ${context.toVersion}`);
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

const ADMIN_PASSWORD_KEY = 'admin_password';
const ADMIN_PASSWORD_MIN_LENGTH = 6;
const ADMIN_PASSWORD_MAX_LENGTH = 128;

type AdminPasswordRecord = {
    hash: string;
    salt: string;
};

const isValidAdminPassword = (password: unknown): password is string =>
    typeof password === 'string' &&
    password.length >= ADMIN_PASSWORD_MIN_LENGTH &&
    password.length <= ADMIN_PASSWORD_MAX_LENGTH;

const setAdminPassword = (password: string) => {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 32);
    store.set(ADMIN_PASSWORD_KEY, {
        hash: hash.toString('hex'),
        salt: salt.toString('hex'),
    } satisfies AdminPasswordRecord);
};

const verifyAdminPassword = (password: unknown) => {
    if (!isValidAdminPassword(password)) return false;

    const record = store.get(ADMIN_PASSWORD_KEY) as AdminPasswordRecord | undefined;
    if (!record?.hash || !record.salt) return false;

    try {
        const expected = Buffer.from(record.hash, 'hex');
        const actual = scryptSync(password, Buffer.from(record.salt, 'hex'), expected.length);
        return expected.length > 0 && timingSafeEqual(actual, expected);
    } catch (error) {
        log.warn('Unable to verify administrator password', error);
        return false;
    }
};

ipcMain.handle('admin-password-is-set', () => {
    const record = store.get(ADMIN_PASSWORD_KEY) as AdminPasswordRecord | undefined;
    return Boolean(record?.hash && record.salt);
});

ipcMain.handle('admin-password-set', (_event, password: unknown) => {
    if (!isValidAdminPassword(password)) return false;

    setAdminPassword(password);
    return true;
});

ipcMain.handle('admin-password-verify', (_event, password: unknown) =>
    verifyAdminPassword(password),
);

ipcMain.handle(
    'admin-password-change',
    (_event, currentPassword: unknown, newPassword: unknown) => {
        if (!verifyAdminPassword(currentPassword) || !isValidAdminPassword(newPassword)) {
            return false;
        }

        setAdminPassword(newPassword);
        return true;
    },
);

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

ipcMain.handle('settings-set-sync', (__event, data: { property: string; value: any }) => {
    if (data.value === null) {
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

    log.warn('Password encryption unavailable', { serverId: server });
    return null;
});

ipcMain.on('password-remove', (_event, server: string) => {
    const passwords = store.get('server', {}) as Record<string, string>;
    if (server in passwords) {
        delete passwords[server];
    }
    store.set({ server: passwords });
    log.info('Password removed', { serverId: server });
});

ipcMain.handle('password-set', (_event, password: string, server: string) => {
    if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(password);
        const passwords = store.get('server', {}) as Record<string, string>;
        passwords[server] = encrypted.toString('hex');
        store.set({ server: passwords });

        log.info('Password saved', { serverId: server });
        return true;
    }

    log.warn('Password encryption unavailable', { serverId: server });
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
    .catch((error) => log.error('Failed to start custom css watcher', error));

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
