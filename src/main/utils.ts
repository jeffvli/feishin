/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import path from 'path';
import process from 'process';
import { URL } from 'url';
import log from 'electron-log/main';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 4343;
    resolveHtmlPath = (htmlFileName: string) => {
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    };
} else {
    resolveHtmlPath = (htmlFileName: string) => {
        return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
    };
}

export const isMacOS = () => {
    return process.platform === 'darwin';
};

export const isWindows = () => {
    return process.platform === 'win32';
};

export const isLinux = () => {
    return process.platform === 'linux';
};

export const hotkeyToElectronAccelerator = (hotkey: string) => {
    let accelerator = hotkey;

    const replacements = {
        mod: 'CmdOrCtrl',
        numpad: 'num',
        numpadadd: 'numadd',
        numpaddecimal: 'numdec',
        numpaddivide: 'numdiv',
        numpadenter: 'numenter',
        numpadmultiply: 'nummult',
        numpadsubtract: 'numsub',
    };

    Object.keys(replacements).forEach((key) => {
        accelerator = accelerator.replace(key, replacements[key as keyof typeof replacements]);
    });

    return accelerator;
};

const logMethod = {
    debug: log.debug,
    error: log.error,
    info: log.info,
    success: log.info,
    verbose: log.verbose,
    warning: log.warn,
};

const logColor = {
    debug: 'blue',
    error: 'red',
    info: 'blue',
    success: 'green',
    verbose: 'blue',
    warning: 'yellow',
};

export const createLog = (data: {
    message: string;
    type: 'debug' | 'verbose' | 'success' | 'error' | 'warning' | 'info';
}) => {
    logMethod[data.type](`%c${data.message}`, `color: ${logColor[data.type]}`);
};

export const autoUpdaterLogInterface = {
    debug: (message: string) => {
        createLog({ message: `[SYSTEM] ${message}`, type: 'debug' });
    },

    error: (message: string) => {
        createLog({ message: `[SYSTEM] ${message}`, type: 'error' });
    },

    info: (message: string) => {
        createLog({ message: `[SYSTEM] ${message}`, type: 'info' });
    },

    warn: (message: string) => {
        createLog({ message: `[SYSTEM] ${message}`, type: 'warning' });
    },
};
