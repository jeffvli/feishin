import isElectron from 'is-electron';
import { useEffect } from 'react';

import { usePlayerStore, useSettingsStore } from '/@/renderer/store';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

const utils = isElectron() ? window.api.utils : null;
const ipc = isElectron() ? window.api.ipc : null;

// Pause local playback when the system goes to sleep, unless the user wants it to resume on wake.
// If the renderer is frozen before this runs, the queued message is handled right after wake.
// Remote players (Jukebox, DLNA) keep playing regardless, so they are left alone.
export const PauseOnSleepHook = () => {
    useEffect(() => {
        utils?.rendererSystemSuspend(() => {
            const { resumeAfterSleep, type } = useSettingsStore.getState().playback;
            const { mediaPause, player } = usePlayerStore.getState();
            const isLocalPlayer = type === PlayerType.LOCAL || type === PlayerType.WEB;

            if (!resumeAfterSleep && isLocalPlayer && player.status === PlayerStatus.PLAYING) {
                mediaPause();
            }
        });

        return () => {
            ipc?.removeAllListeners('renderer-system-suspend');
        };
    }, []);

    return null;
};
