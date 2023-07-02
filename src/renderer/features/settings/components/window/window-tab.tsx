import { Divider, Stack } from '@mantine/core';
import { UpdateSettings } from '/@/renderer/features/settings/components/window/update-settings';
import { WindowSettings } from '/@/renderer/features/settings/components/window/window-settings';

export const WindowTab = () => {
    return (
        <Stack spacing="md">
            <WindowSettings />
            <Divider />
            <UpdateSettings />
        </Stack>
    );
};
