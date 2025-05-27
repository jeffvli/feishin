import isElectron from 'is-electron';
import { lazy, Suspense, useMemo } from 'react';

import { AudioSettings } from '/@/renderer/features/settings/components/playback/audio-settings';
import { LyricSettings } from '/@/renderer/features/settings/components/playback/lyric-settings';
import { ScrobbleSettings } from '/@/renderer/features/settings/components/playback/scrobble-settings';
import { TranscodeSettings } from '/@/renderer/features/settings/components/playback/transcode-settings';
import { useSettingsStore } from '/@/renderer/store';
import { Stack } from '/@/shared/components/stack/stack';
import { PlaybackType } from '/@/shared/types/types';

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
        <Stack gap="md">
            <AudioSettings hasFancyAudio={hasFancyAudio} />
            <Suspense fallback={<></>}>{hasFancyAudio && <MpvSettings />}</Suspense>
            <TranscodeSettings />
            <ScrobbleSettings />
            <LyricSettings />
        </Stack>
    );
};
