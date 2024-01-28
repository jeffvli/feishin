import { Divider, Stack } from '@mantine/core';
import { UpdateSettings } from '/@/renderer/features/settings/components/window/update-settings';
import { WindowSettings } from '/@/renderer/features/settings/components/window/window-settings';
import { DiscordSettings } from '/@/renderer/features/settings/components/window/discord-settings';
import { CacheSettings } from '/@/renderer/features/settings/components/window/cache-settngs';

export const WindowTab = () => {
    return (
        <Stack spacing="md">
            <WindowSettings />
            <Divider />
            <DiscordSettings />
            <Divider />
            <UpdateSettings />
            <Divider />
            <CacheSettings />
        </Stack>
    );
};
