import isElectron from 'is-electron';
import { useCallback, useEffect } from 'react';

import { useCurrentStatus } from '/@/renderer/store';
import { useWindowSettings } from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

export const usePowerSaveBlocker = () => {
    const status = useCurrentStatus();
    const { preventSleepOnPlayback } = useWindowSettings();

    const startPowerSaveBlocker = useCallback(async () => {
        if (!ipc) return;

        try {
            await ipc.invoke('power-save-blocker-start');
        } catch (error) {
            console.error('Failed to start power save blocker:', error);
        }
    }, []);

    const stopPowerSaveBlocker = useCallback(async () => {
        if (!ipc) return;

        try {
            await ipc.invoke('power-save-blocker-stop');
        } catch (error) {
            console.error('Failed to stop power save blocker:', error);
        }
    }, []);

    useEffect(() => {
        if (!preventSleepOnPlayback) return;

        if (status === PlayerStatus.PLAYING) {
            startPowerSaveBlocker();
        } else {
            stopPowerSaveBlocker();
        }
    }, [status, preventSleepOnPlayback, startPowerSaveBlocker, stopPowerSaveBlocker]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopPowerSaveBlocker();
        };
    }, [stopPowerSaveBlocker]);
};
