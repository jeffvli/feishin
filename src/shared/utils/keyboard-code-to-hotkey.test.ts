import { describe, expect, it } from 'vitest';

import { keyboardCodeToHotkeyKey } from '/@/shared/utils/keyboard-code-to-hotkey';

describe('keyboardCodeToHotkeyKey', () => {
    it.each([
        ['KeyA', 'a'],
        ['Digit7', '7'],
        ['F1', 'f1'],
        ['F24', 'f24'],
        ['ArrowLeft', 'arrowleft'],
        ['Space', 'space'],
        ['Equal', 'equal'],
        ['Minus', 'minus'],
        ['Slash', '/'],
        ['Numpad5', 'numpad5'],
        ['NumpadAdd', 'numpadadd'],
        ['NumpadDecimal', 'numpaddecimal'],
        ['NumpadEnter', 'numpadenter'],
    ])('maps %s to %j', (code, expected) => {
        expect(keyboardCodeToHotkeyKey(code)).toBe(expected);
    });

    it.each(['ShiftLeft', 'F25', 'NumpadEqual', 'IntlBackslash', ''])(
        'returns null for unsupported code %j',
        (code) => {
            expect(keyboardCodeToHotkeyKey(code)).toBeNull();
        },
    );
});
