import { describe, expect, it } from 'vitest';

import { hotkeyToElectronAccelerator } from '/@/main/utils';

describe('hotkeyToElectronAccelerator', () => {
    it.each([
        ['mod+shift+k', 'CmdOrCtrl+shift+k'],
        ['mod+arrowright', 'CmdOrCtrl+Right'],
        ['alt+arrowdown', 'alt+Down'],
        ['mod+numpad5', 'CmdOrCtrl+num5'],
        ['mod+numpadadd', 'CmdOrCtrl+numadd'],
        ['space', 'space'],
        ['f5', 'f5'],
    ])('converts %j to %j', (hotkey, expected) => {
        expect(hotkeyToElectronAccelerator(hotkey)).toBe(expected);
    });

    // Regression: substring replacement produced names Electron rejects (e.g. 'numdecimal')
    it.each([
        ['mod+numpaddecimal', 'CmdOrCtrl+numdec'],
        ['mod+numpadsubtract', 'CmdOrCtrl+numsub'],
        ['mod+numpadmultiply', 'CmdOrCtrl+nummult'],
        ['mod+numpaddivide', 'CmdOrCtrl+numdiv'],
        ['mod+equal', 'CmdOrCtrl+='],
        ['mod+shift+minus', 'CmdOrCtrl+shift+-'],
    ])('converts %j to a valid accelerator %j', (hotkey, expected) => {
        expect(hotkeyToElectronAccelerator(hotkey)).toBe(expected);
    });
});
