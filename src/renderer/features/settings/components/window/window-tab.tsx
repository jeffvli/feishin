import { Divider, Stack } from '@mantine/core';
import { UpdateSettings } from '/@/renderer/features/settings/components/window/update-settings';
import { WindowSettings } from '/@/renderer/features/settings/components/window/window-settings';
import { DiscordSettings } from '/@/renderer/features/settings/components/window/discord-settings';

export const WindowTab = () => {
    return (
        <Stack spacing="md">
            <WindowSettings />
            <Divider />
            <DiscordSettings />
            <Divider />
            <UpdateSettings />
        </Stack>
    );
};
