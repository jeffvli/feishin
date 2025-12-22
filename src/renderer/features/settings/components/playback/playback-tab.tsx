import isElectron from 'is-electron';
import { lazy, Suspense, useMemo } from 'react';

import { AudioSettings } from '/@/renderer/features/settings/components/playback/audio-settings';
import { AutoDJSettings } from '/@/renderer/features/settings/components/playback/auto-dj-settings';
import { PlayerFilterSettings } from '/@/renderer/features/settings/components/playback/player-filter-settings';
import { TranscodeSettings } from '/@/renderer/features/settings/components/playback/transcode-settings';
import { useSettingsStore } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Stack } from '/@/shared/components/stack/stack';
import { PlayerType } from '/@/shared/types/types';

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
            (isElectron() && audioType === PlayerType.LOCAL) ||
            (useWebAudio && 'AudioContext' in window)
        );
    }, [audioType, useWebAudio]);

    return (
        <Stack gap="md">
            <AudioSettings />
            <Suspense fallback={<></>}>{hasFancyAudio && <MpvSettings />}</Suspense>
            <Divider />
            <TranscodeSettings />
            <Divider />
            <PlayerFilterSettings />
            <Divider />
            <AutoDJSettings />
        </Stack>
    );
};
