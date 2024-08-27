import { Stack } from '@mantine/core';
import { StylesSettings } from '/@/renderer/features/settings/components/advanced/styles-settings';

export const AdvancedTab = () => {
    return (
        <Stack spacing="md">
            <StylesSettings />
        </Stack>
    );
};
