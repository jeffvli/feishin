import type { TitleTheme } from '/@/shared/types/types';

import { app, dialog, ipcMain, nativeTheme, OpenDialogOptions, safeStorage } from 'electron';
import Store from 'electron-store';
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
