import isElectron from 'is-electron';
import React, { useCallback, useEffect } from 'react';

import { usePlayerStatus, useSettingsStore, useWindowSettings } from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

export const usePowerSaveBlocker = () => {
    const status = usePlayerStatus();
    const { preventSleepOnPlayback, preventSuspendOnPlayback } = useWindowSettings();

    const startPowerSaveBlocker = useCallback(async () => {
        if (!ipc) return;

        try {
            await ipc.invoke('power-save-blocker-start', { full: preventSleepOnPlayback });
        } catch (error) {
            console.error('Failed to start power save blocker:', error);
        }
    }, [preventSleepOnPlayback]);

    const stopPowerSaveBlocker = useCallback(async () => {
        if (!ipc) return;

        try {
            await ipc.invoke('power-save-blocker-stop');
        } catch (error) {
            console.error('Failed to stop power save blocker:', error);
        }
    }, []);

    useEffect(() => {
        if (!preventSleepOnPlayback || !preventSuspendOnPlayback) return;

        if (status === PlayerStatus.PLAYING) {
            startPowerSaveBlocker();
        } else {
            stopPowerSaveBlocker();
        }
    }, [
        status,
        preventSleepOnPlayback,
        startPowerSaveBlocker,
        stopPowerSaveBlocker,
        preventSuspendOnPlayback,
    ]);

    useEffect(() => {
        return () => {
            stopPowerSaveBlocker();
        };
    }, [stopPowerSaveBlocker]);
};

const PowerSaveBlockerHookInner = () => {
    usePowerSaveBlocker();
    return null;
};

export const PowerSaveBlockerHook = () => {
    const isElectronEnv = isElectron();
    const preventSleepOnPlayback = useSettingsStore((state) => state.window.preventSleepOnPlayback);
    const preventSuspendOnPlayback = useSettingsStore(
        (state) => state.window.preventSuspendOnPlayback,
    );

    if (!isElectronEnv || !preventSleepOnPlayback || !preventSuspendOnPlayback) {
        return null;
    }

    return React.createElement(PowerSaveBlockerHookInner);
};
