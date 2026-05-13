import { shallow } from 'zustand/shallow';

import { DEFAULT_EQUALIZER_STATE } from './equalizer.schema';
import * as T from './equalizer.transitions';
import { EqualizerState } from './equalizer.types';

import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';

export interface ActionDeps {
    getEq: () => EqualizerState;
    setSettings: (partial: { playback: { equalizer: EqualizerState } }) => void;
}

export const applyAction = (
    deps: ActionDeps,
    transition: (s: EqualizerState) => EqualizerState,
): void => {
    const next = transition(deps.getEq());
    deps.setSettings({ playback: { equalizer: next } });
};

const eqSelector = (s: any): EqualizerState => s.playback?.equalizer ?? DEFAULT_EQUALIZER_STATE;

export const useEqualizerState = (): EqualizerState => useSettingsStore(eqSelector, shallow);

export const useEqualizerActions = () => {
    const { setSettings } = useSettingsStoreActions();
    const deps: ActionDeps = {
        getEq: () => eqSelector(useSettingsStore.getState() as any),
        setSettings: (partial) => setSettings(partial as any),
    };
    return {
        applyPreset: (id: string) => applyAction(deps, (s) => T.applyPreset(s, id)),
        deleteCustomPreset: (id: string) => applyAction(deps, (s) => T.deleteCustomPreset(s, id)),
        reset: () => applyAction(deps, T.reset),
        saveCustomPreset: (name: string) => applyAction(deps, (s) => T.saveCustomPreset(s, name)),
        setBand: (i: number, db: number) => applyAction(deps, (s) => T.setBand(s, i, db)),
        setEnabled: (v: boolean) => applyAction(deps, (s) => T.setEnabled(s, v)),
        setPreamp: (db: number) => applyAction(deps, (s) => T.setPreamp(s, db)),
    };
};
