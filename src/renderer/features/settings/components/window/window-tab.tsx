import isElectron from 'is-electron';

import { DiscordSettings } from '/@/renderer/features/settings/components/window/discord-settings';
import { PasswordSettings } from '/@/renderer/features/settings/components/window/password-settings';
import { WindowSettings } from '/@/renderer/features/settings/components/window/window-settings';
import { Stack } from '/@/shared/components/stack/stack';

const utils = isElectron() ? window.api.utils : null;

export const WindowTab = () => {
    return (
        <Stack gap="md">
            <WindowSettings />
            <DiscordSettings />
            {utils?.isLinux() && (
                <>
                    <PasswordSettings />
                </>
            )}
        </Stack>
    );
};
