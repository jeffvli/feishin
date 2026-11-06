import { useEffect, useRef } from 'react';

import { useSaveQueue } from '/@/renderer/features/player/hooks/use-queue-restore';
import { useCurrentServer, usePlayerSong, useSettingsStore } from '/@/renderer/store';
import { ServerType } from '/@/shared/types/domain-types';

export const useAutosave = () => {
    const server = useCurrentServer();
    const currentSong = usePlayerSong();
    const priorSongId = useRef<string | undefined>(undefined);
    const songCount = useRef(0);
    const { count, enabled } = useSettingsStore((state) => state.general.autoSave);
    const { mutate: savePlayQueue } = useSaveQueue();

    useEffect(() => {
        if (
            enabled &&
            (server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC)
        ) {
            if (currentSong?._uniqueId !== priorSongId.current) {
                if (songCount.current === count) {
                    savePlayQueue();
                    songCount.current = 1;
                } else {
                    songCount.current += 1;
                }

                priorSongId.current = currentSong?._uniqueId;
            }
        }
    }, [enabled, count, currentSong?._uniqueId, savePlayQueue, server?.type]);
};

export const AutosaveHook = () => {
    useAutosave();
    return null;
};
