import isElectron from 'is-electron';
import { useEffect } from 'react';

import {
    useAccent,
    useGeneralSettings,
    useRemoteSettings,
    useThemeSettings,
} from '/@/renderer/store/settings.store';
import { AppTheme } from '/@/shared/themes/app-theme-types';
import { resolveThemePrimaryColor } from '/@/shared/themes/resolve-primary-color';

const remote = isElectron() ? window.api.remote : null;

/**
 * Pushes desktop settings the phone needs to know about to behave
 * consistently with it — it runs as a separate browser bundle over HTTP
 * (remote.vite.config.ts), with its own empty localStorage, so it has no
 * other way to see any of this.
 *
 * - `confirmQueueChanges`, so `play-submenu-items.tsx` can ask "discard the
 *   current queue?" itself before ever sending a play-now/-shuffle request,
 *   instead of that request silently landing on a confirm modal that only
 *   opens on the desktop screen (see use-remote-library.tsx's
 *   `skipConfirmation` calls).
 * - The resolved `--theme-colors-primary` value for both Default Light and
 *   Default Dark — the remote always forces one of those two base themes
 *   (app.tsx), but the actual primary color also depends on the accent/
 *   shade settings below, which the remote can't compute correctly on its
 *   own without seeing them.
 */
export const useRemoteSettingsPush = () => {
    const isRemoteEnabled = useRemoteSettings().enabled;
    const confirmQueueChanges = useGeneralSettings().confirmQueueChanges;
    const accent = useAccent();
    const { primaryShade, useThemeAccentColor, useThemePrimaryShade } = useThemeSettings();

    useEffect(() => {
        if (!isRemoteEnabled || !remote) return;
        remote.updateConfirmQueueChangesSetting(confirmQueueChanges);
    }, [isRemoteEnabled, confirmQueueChanges]);

    useEffect(() => {
        if (!isRemoteEnabled || !remote) return;

        const settings = { accent, primaryShade, useThemeAccentColor, useThemePrimaryShade };
        remote.updateAccentColor({
            dark: resolveThemePrimaryColor(AppTheme.DEFAULT_DARK, settings),
            light: resolveThemePrimaryColor(AppTheme.DEFAULT_LIGHT, settings),
        });
    }, [isRemoteEnabled, accent, primaryShade, useThemeAccentColor, useThemePrimaryShade]);
};

export const RemoteSettingsPushHook = () => {
    useRemoteSettingsPush();
    return null;
};
