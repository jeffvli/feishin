import type { LogLevel } from '/@/shared/logger/types';

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import log from 'electron-log/main';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';

import { createZipBuffer } from '/@/main/utils/zip';
import { sanitizeForDiagnostics } from '/@/shared/utils/sanitize-for-diagnostics';

export type { LogLevel };
export type { LogSeverity } from '/@/shared/logger/types';

const PROCESS_WIDTH = 10; // width of "[renderer]"
const LEVEL_WIDTH = 5; // width of "DEBUG" / "ERROR"
const RESET = '\x1B[0m';

const levelColors: Record<string, string> = {
    debug: '\x1B[38;2;100;149;237m', // #6495ED
    error: '\x1B[38;2;255;100;100m', // #ff6464
    info: '\x1B[38;2;76;175;80m', // #4caf50
    warn: '\x1B[38;2;225;125;50m', // #e17d32
};

const formatLogLine = ({
    colorize = false,
    data,
    level,
    message,
}: {
    colorize?: boolean;
    data: unknown[];
    level: string;
    message: { date: Date; variables?: { processType?: string } };
}): string[] => {
    const processType = message.variables?.processType === 'renderer' ? 'renderer' : 'main';
    const paddedLevel = String(level).toUpperCase().padEnd(LEVEL_WIDTH, ' ');
    const levelLabel =
        colorize && levelColors[level]
            ? `${levelColors[level]}${paddedLevel}${RESET}`
            : paddedLevel;
    const processLabel = `[${processType}]`.padEnd(PROCESS_WIDTH, ' ');
    const text = data
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            return util.inspect(item, {
                breakLength: 80,
                colors: colorize,
                compact: false,
                depth: null,
            });
        })
        .join(' ');

    return [`${message.date.toISOString()} ${levelLabel} ${processLabel} ${text}`];
};

const isLogLevel = (value: unknown): value is LogLevel => {
    return value === 'debug' || value === 'info';
};

export const setLogLevel = (level: LogLevel) => {
    log.transports.file.level = level;
    log.transports.console.level = level;
};

log.initialize();
setLogLevel(
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true' ? 'debug' : 'info',
);
log.transports.file.format = (params) => formatLogLine({ ...params, colorize: false });
log.transports.file.maxSize = 1024 * 1024 * 10; // 10MB
log.transports.console.format = (params) => formatLogLine({ ...params, colorize: true });

ipcMain.on('logger-set-level', (_event, level: unknown) => {
    if (isLogLevel(level)) {
        setLogLevel(level);
    }
});

ipcMain.handle('logger-open-folder', async () => {
    const logFilePath = log.transports.file.getFile().path;
    const logsPath = path.dirname(logFilePath);
    await shell.openPath(logsPath);
    return true;
});

type ExportDiagnosticsPayload = {
    logLevel?: null | string;
    rendererSettings?: null | Record<string, unknown>;
    server?: null | Record<string, unknown>;
};

const exportDiagnosticsArchive = async (payload: ExportDiagnosticsPayload = {}) => {
    const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const stamp = new Date().toISOString().slice(0, 10);
    const saveOptions = {
        defaultPath: `feishin-diagnostics-${stamp}.zip`,
        filters: [{ extensions: ['zip'], name: 'Zip' }],
    };
    const result = parentWindow
        ? await dialog.showSaveDialog(parentWindow, saveOptions)
        : await dialog.showSaveDialog(saveOptions);

    if (result.canceled || !result.filePath) {
        return { canceled: true };
    }

    const logFile = log.transports.file.getFile();
    const logsDir = path.dirname(logFile.path);
    const entries: { data: Buffer; name: string }[] = [];

    const { store } = await import('/@/main/features/core/settings');

    const diagnostics = {
        app: {
            name: app.getName(),
            version: app.getVersion(),
        },
        arch: process.arch,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        exportedAt: new Date().toISOString(),
        locale: app.getLocale(),
        logLevel: payload.logLevel ?? null,
        node: process.versions.node,
        os: {
            release: os.release(),
            type: os.type(),
            version: typeof os.version === 'function' ? os.version() : undefined,
        },
        platform: process.platform,
        server: payload.server ?? null,
        settings: {
            ignoreCors: store.get('ignore_cors'),
            ignoreSsl: store.get('ignore_ssl'),
            releaseChannel: store.get('release_channel'),
        },
    };

    entries.push({
        data: Buffer.from(`${JSON.stringify(diagnostics, null, 2)}\n`, 'utf8'),
        name: 'diagnostics.json',
    });

    try {
        const configRaw = await fs.readFile(store.path, 'utf8');
        const configJson = JSON.parse(configRaw) as unknown;
        entries.push({
            data: Buffer.from(
                `${JSON.stringify(sanitizeForDiagnostics(configJson), null, 2)}\n`,
                'utf8',
            ),
            name: 'main-config.json',
        });
    } catch (error) {
        log.warn('Failed to read main config for diagnostics export', error);
    }

    if (payload.rendererSettings) {
        entries.push({
            data: Buffer.from(
                `${JSON.stringify(sanitizeForDiagnostics(payload.rendererSettings), null, 2)}\n`,
                'utf8',
            ),
            name: 'renderer-settings.json',
        });
    }

    try {
        const logFiles = await fs.readdir(logsDir);
        for (const fileName of logFiles) {
            if (!fileName.endsWith('.log')) {
                continue;
            }
            const filePath = path.join(logsDir, fileName);
            const data = await fs.readFile(filePath);
            entries.push({ data, name: `logs/${fileName}` });
        }
    } catch (error) {
        log.warn('Failed to read log files for export', error);
    }

    if (!entries.some((entry) => entry.name.startsWith('logs/'))) {
        try {
            entries.push({
                data: await fs.readFile(logFile.path),
                name: `logs/${path.basename(logFile.path)}`,
            });
        } catch (error) {
            log.error('Failed to read active log file for export', error);
            throw error;
        }
    }

    const zipBuffer = createZipBuffer(entries);
    await fs.writeFile(result.filePath, zipBuffer);

    return { canceled: false, path: result.filePath };
};

ipcMain.handle('logger-export-diagnostics', async (_event, payload?: ExportDiagnosticsPayload) => {
    return exportDiagnosticsArchive(payload);
});

export default log;

export const autoUpdaterLogInterface = {
    debug: (message: string) => {
        log.debug(message);
    },

    error: (message: string) => {
        log.error(message);
    },

    info: (message: string) => {
        log.info(message);
    },

    warn: (message: string) => {
        log.warn(message);
    },
};
