const CODE_TO_HOTKEY_KEY: Record<string, string> = {
    ArrowDown: 'arrowdown',
    ArrowLeft: 'arrowleft',
    ArrowRight: 'arrowright',
    ArrowUp: 'arrowup',
    Backspace: 'backspace',
    Delete: 'delete',
    End: 'end',
    Enter: 'enter',
    Equal: 'equal',
    Escape: 'escape',
    Home: 'home',
    Insert: 'insert',
    Minus: 'minus',
    PageDown: 'pagedown',
    PageUp: 'pageup',
    Space: 'space',
    Tab: 'tab',
};

const NUMPAD_CODE_TO_HOTKEY_KEY: Record<string, string> = {
    Add: 'numpadadd',
    Decimal: 'numpaddecimal',
    Divide: 'numpaddivide',
    Enter: 'numpadenter',
    Multiply: 'numpadmultiply',
    Subtract: 'numpadsubtract',
};

export const MODIFIER_KEY_CODES = new Set([
    'AltLeft',
    'AltRight',
    'ControlLeft',
    'ControlRight',
    'MetaLeft',
    'MetaRight',
    'ShiftLeft',
    'ShiftRight',
]);

export const keyboardCodeToHotkeyKey = (code: string): null | string => {
    const mapped = CODE_TO_HOTKEY_KEY[code];
    if (mapped) {
        return mapped;
    }

    if (code.startsWith('Key')) {
        return code.slice(3).toLowerCase();
    }

    if (code.startsWith('Digit')) {
        return code.slice(5);
    }

    if (code.startsWith('Numpad')) {
        const suffix = code.slice(6);
        const numpadMapped = NUMPAD_CODE_TO_HOTKEY_KEY[suffix];
        if (numpadMapped) {
            return numpadMapped;
        }

        if (/^\d$/.test(suffix)) {
            return `numpad${suffix}`;
        }
    }

    return null;
};
