import { lazy, Suspense } from 'react';
import { Divider, Stack } from '@mantine/core';
import { AudioSettings } from '/@/renderer/features/settings/components/playback/audio-settings';
import { ScrobbleSettings } from '/@/renderer/features/settings/components/playback/scrobble-settings';
import isElectron from 'is-electron';
import { LyricSettings } from '/@/renderer/features/settings/components/playback/lyric-settings';

const MpvSettings = lazy(() =>
  import('/@/renderer/features/settings/components/playback/mpv-settings').then((module) => {
    return { default: module.MpvSettings };
  }),
);

export const PlaybackTab = () => {
  return (
    <Stack spacing="md">
      <AudioSettings />
      <Suspense fallback={<></>}>{isElectron() && <MpvSettings />}</Suspense>
      <Divider />
      <ScrobbleSettings />
      <Divider />
      <LyricSettings />
    </Stack>
  );
};
