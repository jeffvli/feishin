import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import i18n from '/@/i18n/i18n';
import { openRestartRequiredToast } from '/@/renderer/features/settings/restart-toast';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { logger } from '/@/renderer/utils/logger';
import { PlayerType } from '/@/shared/types/types';
// Synchronizes settings from the renderer store to the main process electron store
// on app initialization. If there are differences, it updates the main store and shows
// a restart required toast.
export const useSyncSettingsToMain = () => {
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) {
            return;
        }

        if (!isElectron() || !window.api.localSettings) {
            hasRunRef.current = true;
            return;
        }

        // Wait some before checking for differences to ensure the store is hydrated from localStorage
        const timeoutId = setTimeout(() => {
            if (hasRunRef.current) {
                return;
            }

            const settingsFromStore = useSettingsStore.getState();

            const settings = {
                font: settingsFromStore.font,
                general: settingsFromStore.general,
                hotkeys: settingsFromStore.hotkeys,
                lyrics: settingsFromStore.lyrics,
                playback: settingsFromStore.playback,
                window: settingsFromStore.window,
            };

            hasRunRef.current = true;

            const localSettings = window.api.localSettings;

            const settingsMappings: Array<{
                mainStoreKey: string;
                rendererValue: any;
            }> = [
                {
                    mainStoreKey: 'lyrics',
                    rendererValue: settings.lyrics.sources,
                },
                {
                    mainStoreKey: 'window_window_bar_style',
                    rendererValue: settings.window.windowBarStyle,
                },
                {
                    mainStoreKey: 'window_start_minimized',
                    rendererValue: settings.window.startMinimized,
                },
                {
                    mainStoreKey: 'window_exit_to_tray',
                    rendererValue: settings.window.exitToTray,
                },
                {
                    mainStoreKey: 'window_minimize_to_tray',
                    rendererValue: settings.window.minimizeToTray,
                },
                {
                    mainStoreKey: 'disable_auto_updates',
                    rendererValue: settings.window.disableAutoUpdate,
                },
                // For some reason after the application is updated, the release channel from the
                // renderer is always set to the latest channel. This causes an infinite update loop
                // {
                //     mainStoreKey: 'release_channel',
                //     rendererValue: settings.window.releaseChannel,
                // },
                {
                    mainStoreKey: 'window_enable_tray',
                    rendererValue: settings.window.tray,
                },
                {
                    mainStoreKey: 'password_store',
                    rendererValue: settings.general.passwordStore,
                },
                {
                    mainStoreKey: 'mediaSession',
                    rendererValue: settings.playback.mediaSession,
                },
                {
                    mainStoreKey: 'playbackType',
                    rendererValue: settings.playback.type,
                },
                {
                    mainStoreKey: 'global_media_hotkeys',
                    rendererValue: settings.hotkeys.globalMediaHotkeys,
                },
                {
                    mainStoreKey: 'enableNeteaseTranslation',
                    rendererValue: settings.lyrics.enableNeteaseTranslation,
                },
                {
                    mainStoreKey: 'local_font_path',
                    rendererValue: settings.font.custom,
                },
            ];

            // Compare and sync each setting
            (async () => {
                let hasDifferences = false;

                for (const mapping of settingsMappings) {
                    const mainValue = await localSettings.get(mapping.mainStoreKey);
                    const rendererValue = mapping.rendererValue;

                    const mainValueNormalized = mainValue === undefined ? null : mainValue;
                    const rendererValueNormalized =
                        rendererValue === undefined ? null : rendererValue;

                    if (
                        JSON.stringify(mainValueNormalized) !==
                        JSON.stringify(rendererValueNormalized)
                    ) {
                        // The renderer copy of the audio player type can go stale
                        // (e.g. cleared site data) while the main process still holds
                        // the user's explicit choice. Adopt the main value instead of
                        // wiping it — otherwise MPV reverts to Web on every restart.
                        // See https://github.com/jeffvli/feishin/issues/2544
                        if (
                            mapping.mainStoreKey === 'playbackType' &&
                            (rendererValueNormalized === null ||
                                rendererValueNormalized === PlayerType.WEB) &&
                            typeof mainValueNormalized === 'string' &&
                            (Object.values(PlayerType) as string[]).includes(mainValueNormalized)
                        ) {
                            logger.info('Restoring audio player type from main process settings', {
                                playbackType: mainValueNormalized,
                            });
                            useSettingsStore.getState().actions.setSettings({
                                playback: { type: mainValueNormalized as PlayerType },
                            });
                            continue;
                        }

                        hasDifferences = true;
                        logger.warn(
                            'Differences found between renderer and main process settings',
                            {
                                mainStoreKey: mapping.mainStoreKey,
                                mainValue: mainValueNormalized,
                                rendererValue: rendererValueNormalized,
                            },
                        );
                        localSettings.set(mapping.mainStoreKey, rendererValue);
                    }
                }

                // Show restart toast if there were differences
                if (hasDifferences) {
                    openRestartRequiredToast(i18n.t('error.settingsSyncError'));
                }
            })();
        }, 5000);

        return () => {
            clearTimeout(timeoutId);
        };
        // Only run once on mount
    }, []);
};
