import isElectron from 'is-electron';
import { useEffect, useMemo } from 'react';

import { DEFAULT_EQUALIZER_STATE } from './equalizer.schema';
import { EqualizerState } from './equalizer.types';
import { createMpvEqDispatcher } from './mpv-eq-dispatcher';

import { usePlaybackType } from '/@/renderer/store';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? (window as any).api?.mpvPlayer : null;

const selector = (s: any): EqualizerState => s.playback?.equalizer ?? DEFAULT_EQUALIZER_STATE;

export const MpvEqualizerHook = (): null => {
    const playbackType = usePlaybackType();

    const dispatcher = useMemo(
        () =>
            mpvPlayer?.setProperties
                ? createMpvEqDispatcher({
                      setProperties: (p) => mpvPlayer.setProperties(p),
                  })
                : null,
        [],
    );

    useEffect(() => {
        if (!dispatcher) return;
        // initial dispatch on mount
        dispatcher.dispatch(
            selector(useSettingsStore.getState()),
            playbackType === PlayerType.LOCAL,
        );
        const unsub = useSettingsStore.subscribe((curr, prev) => {
            const eq = selector(curr);
            const prevEq = selector(prev);
            if (eq === prevEq) return; // shallow inequality is enough — actions always produce new ref
            dispatcher.dispatch(eq, playbackType === PlayerType.LOCAL);
        });
        return unsub;
    }, [dispatcher, playbackType]);

    return null;
};
