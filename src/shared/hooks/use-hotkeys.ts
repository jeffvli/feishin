import {
    type HotkeyItem as MantineHotkeyItem,
    useHotkeys as useMantineHotkeys,
} from '@mantine/hooks';

export const useHotkeys = useMantineHotkeys;

export type HotkeyItem = MantineHotkeyItem;
