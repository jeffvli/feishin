import isElectron from 'is-electron';
import { useEffect } from 'react';

import { useIsRadioActive, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { useRemoteSettings } from '/@/renderer/store/settings.store';

const remote = isElectron() ? window.api.remote : null;

/**
 * Pushes radio-active/station-name state to the phone. Needed because the
 * existing song/state push pipeline is wired only to the normal queue's
 * current-song subscription — radio metadata never flows through it, so
 * without this the phone's Home tab would show a frozen last-queue-song
 * while a radio station is actually playing.
 */
export const useRemoteRadioPush = () => {
    const isRemoteEnabled = useRemoteSettings().enabled;
    const isRadioActive = useIsRadioActive();
    const stationName = useRadioStore((state) => state.stationName);
    const currentStationArt = useRadioStore((state) => state.currentStationArt);

    useEffect(() => {
        if (!isRemoteEnabled || !remote) return;

        if (isRadioActive) {
            remote.updateRadioStatus({
                imageUrl: currentStationArt?.imageUrl ?? null,
                isActive: true,
                stationName: stationName ?? '',
            });
        } else {
            remote.updateRadioStatus({ isActive: false });
        }
    }, [isRemoteEnabled, isRadioActive, stationName, currentStationArt]);
};

export const RemoteRadioPushHook = () => {
    useRemoteRadioPush();
    return null;
};
