import { describe, expect, it } from 'vitest';

import { toPhysicalHotkey, withPhysicalKeys } from '/@/shared/utils/hotkeys';

describe('toPhysicalHotkey', () => {
    it.each([
        ['mod+1', 'mod+Digit1'],
        ['Ctrl+Shift+k', 'ctrl+shift+k'],
        ['mod+/', 'mod+Slash'],
        ["alt+'", 'alt+Quote'],
        ['mod + [plus]', 'mod+[plus]'],
        ['space', 'space'],
        ['mod+equal', 'mod+equal'],
    ])('converts %j to %j', (hotkey, expected) => {
        expect(toPhysicalHotkey(hotkey)).toBe(expected);
    });
});

describe('withPhysicalKeys', () => {
    it('converts hotkeys and forces physical key matching', () => {
        const handler = () => {};
        expect(withPhysicalKeys([['mod+1', handler, { preventDefault: false }]])).toEqual([
            ['mod+Digit1', handler, { preventDefault: true, usePhysicalKeys: true }],
        ]);
    });
});
