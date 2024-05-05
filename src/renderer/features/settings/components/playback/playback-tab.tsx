import { lazy, Suspense, useMemo } from 'react';
import { Stack } from '@mantine/core';
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
    const hasFancyAudio = useMemo(() => {
        return isElectron() || 'AudioContext' in window;
    }, []);

    return (
        <Stack spacing="md">
            <AudioSettings hasFancyAudio={hasFancyAudio} />
            <Suspense fallback={<></>}>{hasFancyAudio && <MpvSettings />}</Suspense>
            <ScrobbleSettings />
            <LyricSettings />
        </Stack>
    );
};
