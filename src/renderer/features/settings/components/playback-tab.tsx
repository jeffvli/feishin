import { Divider, Stack } from '@mantine/core';
import { AudioSettings } from '/@/renderer/features/settings/components/playback/audio-settings';
import { ScrobbleSettings } from '/@/renderer/features/settings/components/playback/scrobble-settings';

export const PlaybackTab = () => {
  return (
    <Stack spacing="md">
      <AudioSettings />
      <Divider />
      <ScrobbleSettings />
    </Stack>
  );
};
