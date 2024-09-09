import { lazy, Suspense, useMemo } from 'react';
import { Stack } from '@mantine/core';
import { AudioSettings } from '/@/renderer/features/settings/components/playback/audio-settings';
import { ScrobbleSettings } from '/@/renderer/features/settings/components/playback/scrobble-settings';
import isElectron from 'is-electron';
import { LyricSettings } from '/@/renderer/features/settings/components/playback/lyric-settings';
import { useSettingsStore } from '/@/renderer/store';
import { PlaybackType } from '/@/renderer/types';
import { TranscodeSettings } from '/@/renderer/features/settings/components/playback/transcode-settings';

const MpvSettings = lazy(() =>
    import('/@/renderer/features/settings/components/playback/mpv-settings').then((module) => {
        return { default: module.MpvSettings };
    }),
);

export const PlaybackTab = () => {
    const audioType = useSettingsStore((state) => state.playback.type);
    const useWebAudio = useSettingsStore((state) => state.playback.webAudio);

    const hasFancyAudio = useMemo(() => {
        return (
            (isElectron() && audioType === PlaybackType.LOCAL) ||
            (useWebAudio && 'AudioContext' in window)
        );
    }, [audioType, useWebAudio]);

    return (
        <Stack spacing="md">
            <AudioSettings hasFancyAudio={hasFancyAudio} />
            <Suspense fallback={<></>}>{hasFancyAudio && <MpvSettings />}</Suspense>
            <TranscodeSettings />
            <ScrobbleSettings />
            <LyricSettings />
        </Stack>
    );
};
