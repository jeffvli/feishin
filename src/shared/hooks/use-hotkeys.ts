import {
    type HotkeyItem as MantineHotkeyItem,
    useHotkeys as useMantineHotkeys,
} from '@mantine/hooks';
import { useMemo } from 'react';

import { withPhysicalKeys } from '/@/shared/utils/hotkeys';

export const useHotkeys = (
    hotkeys: MantineHotkeyItem[],
    tagsToIgnore?: string[],
    triggerOnContentEditable?: boolean,
) => {
    const physicalHotkeys = useMemo(() => withPhysicalKeys(hotkeys), [hotkeys]);
    useMantineHotkeys(physicalHotkeys, tagsToIgnore, triggerOnContentEditable);
};

export type HotkeyItem = MantineHotkeyItem;
