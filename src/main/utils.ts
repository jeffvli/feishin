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

// Electron throws on key names it does not know, so map whole keys rather than substrings: a
// substring replace turned 'numpaddecimal' into 'numdecimal'. Names follow the hotkey recorder
// (keyboardCodeToHotkeyKey) on one side and Electron's accelerator key codes on the other.
const ACCELERATOR_KEYS: Record<string, string> = {
    arrowdown: 'Down',
    arrowleft: 'Left',
    arrowright: 'Right',
    arrowup: 'Up',
    equal: '=',
    minus: '-',
    mod: 'CmdOrCtrl',
    numpadadd: 'numadd',
    numpaddecimal: 'numdec',
    numpaddivide: 'numdiv',
    numpadmultiply: 'nummult',
    numpadsubtract: 'numsub',
};

export const hotkeyToElectronAccelerator = (hotkey: string) =>
    hotkey
        .split('+')
        .map((key) => ACCELERATOR_KEYS[key] ?? key.replace(/^numpad(?=\d$)/, 'num'))
        .join('+');
