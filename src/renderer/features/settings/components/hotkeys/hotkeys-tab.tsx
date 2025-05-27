import isElectron from 'is-electron';

import { HotkeyManagerSettings } from '/@/renderer/features/settings/components/hotkeys/hotkey-manager-settings';
import { WindowHotkeySettings } from '/@/renderer/features/settings/components/hotkeys/window-hotkey-settings';
import { Stack } from '/@/shared/components/stack/stack';

export const HotkeysTab = () => {
    return (
        <Stack gap="md">
            {isElectron() && <WindowHotkeySettings />}
            <HotkeyManagerSettings />
        </Stack>
    );
};
