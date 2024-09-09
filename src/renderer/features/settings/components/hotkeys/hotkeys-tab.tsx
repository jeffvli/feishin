import { Stack } from '@mantine/core';
import isElectron from 'is-electron';
import { WindowHotkeySettings } from './window-hotkey-settings';
import { HotkeyManagerSettings } from '/@/renderer/features/settings/components/hotkeys/hotkey-manager-settings';

export const HotkeysTab = () => {
    return (
        <Stack spacing="md">
            {isElectron() && <WindowHotkeySettings />}
            <HotkeyManagerSettings />
        </Stack>
    );
};
