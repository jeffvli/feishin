/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import path from 'path';
import process from 'process';
import { URL } from 'url';

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

export type MediaCache = {
    enabled?: boolean;
    path?: string;
};
