import { Divider, Stack } from '@mantine/core';
import { WindowHotkeySettings } from './window-hotkey-settings';
import { HotkeyManagerSettings } from '/@/renderer/features/settings/components/hotkeys/hotkey-manager-settings';

export const HotkeysTab = () => {
  return (
    <Stack spacing="md">
      <WindowHotkeySettings />
      <Divider />
      <HotkeyManagerSettings />
    </Stack>
  );
};
