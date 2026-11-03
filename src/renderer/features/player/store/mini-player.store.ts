import isElectron from 'is-electron';
import { create } from 'zustand';

import { useSettingsStore } from '/@/renderer/store/settings.store';

const browser = isElectron() ? window.api.browser : null;

// Not persisted: the main process always relaunches in full mode
export const useMiniPlayerStore = create<{ enabled: boolean }>(() => ({ enabled: false }));

export const setMiniPlayer = (enabled: boolean) => {
    if (!browser) return;

    useMiniPlayerStore.setState({ enabled });
    browser.setMiniPlayer(enabled, useSettingsStore.getState().window.miniPlayerAlwaysOnTop);
};
