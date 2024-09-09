import { Stack } from '@mantine/core';
import { UpdateSettings } from '/@/renderer/features/settings/components/window/update-settings';
import { WindowSettings } from '/@/renderer/features/settings/components/window/window-settings';
import { DiscordSettings } from '/@/renderer/features/settings/components/window/discord-settings';
import isElectron from 'is-electron';
import { PasswordSettings } from '/@/renderer/features/settings/components/window/password-settings';

const utils = isElectron() ? window.electron.utils : null;

export const WindowTab = () => {
    return (
        <Stack spacing="md">
            <WindowSettings />
            <DiscordSettings />
            <UpdateSettings />
            {utils?.isLinux() && (
                <>
                    <PasswordSettings />
                </>
            )}
        </Stack>
    );
};
