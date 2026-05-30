import {
    type HotkeyItem as MantineHotkeyItem,
    useHotkeys as useMantineHotkeys,
} from '@mantine/hooks';
import { useMemo } from 'react';

import { useAppStore } from '/@/renderer/store';
import { withPhysicalKeys } from '/@/shared/utils/hotkeys';

const EMPTY_HOTKEYS: MantineHotkeyItem[] = [];

export const useHotkeys = (
    hotkeys: MantineHotkeyItem[],
    tagsToIgnore?: string[],
    triggerOnContentEditable?: boolean,
) => {
    const commandPaletteOpened = useAppStore((state) => state.commandPalette.opened);
    const physicalHotkeys = useMemo(() => withPhysicalKeys(hotkeys), [hotkeys]);

    useMantineHotkeys(
        commandPaletteOpened ? EMPTY_HOTKEYS : physicalHotkeys,
        tagsToIgnore,
        triggerOnContentEditable,
    );
};

export type HotkeyItem = MantineHotkeyItem;
