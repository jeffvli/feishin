import type { HotkeyItem } from '@mantine/hooks';

const RESERVED_KEYS = new Set(['alt', 'ctrl', 'meta', 'mod', 'shift']);

/**
 * Converts stored hotkey strings to Mantine's physical-key format.
 * Mantine matches KeyboardEvent.code via normalizeKey, which turns Digit1 into
 * "digit1" but leaves "1" as "1" — so mod+1 must become mod+Digit1.
 */
export const toPhysicalHotkey = (hotkey: string): string =>
    hotkey
        .split('+')
        .map((part) => part.trim())
        .map((part) => {
            if (part === '[plus]') {
                return part;
            }

            const lower = part.toLowerCase();
            if (RESERVED_KEYS.has(lower)) {
                return lower;
            }

            if (/^\d$/.test(part)) {
                return `Digit${part}`;
            }

            return part;
        })
        .join('+');

export const withPhysicalKeys = (hotkeys: HotkeyItem[]): HotkeyItem[] =>
    hotkeys.map(([hotkey, handler, options]) => [
        toPhysicalHotkey(hotkey),
        handler,
        { ...options, usePhysicalKeys: true },
    ]);
