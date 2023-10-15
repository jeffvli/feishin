import { Divider, Stack } from '@mantine/core';
import { Equalizer } from '/@/renderer/features/settings/components/advanced-audio/equalizer';

export const AdvancedAudioTab = () => {
    return (
        <Stack spacing="md">
            <Equalizer />
            <Divider />
        </Stack>
    );
};
