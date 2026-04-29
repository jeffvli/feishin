import {
    type HotkeyItem as MantineHotkeyItem,
    useHotkeys as useMantineHotkeys,
} from '@mantine/hooks';

import { useAppStore } from '/@/renderer/store';

const EMPTY_HOTKEYS: MantineHotkeyItem[] = [];

export const useHotkeys = (
    hotkeys: MantineHotkeyItem[],
    tagsToIgnore?: string[],
    triggerOnContentEditable?: boolean,
) => {
    const commandPaletteOpened = useAppStore((state) => state.commandPalette.opened);
    useMantineHotkeys(
        commandPaletteOpened ? EMPTY_HOTKEYS : hotkeys,
        tagsToIgnore,
        triggerOnContentEditable,
    );
};

export type HotkeyItem = MantineHotkeyItem;
