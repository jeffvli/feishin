import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import isElectron from 'is-electron';
import { useEffect, useMemo, useRef, useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import './styles/global.css';

import '@ag-grid-community/styles/ag-grid.css';
import 'overlayscrollbars/overlayscrollbars.css';

import './styles/overlayscrollbars.css';

import i18n from '/@/i18n/i18n';
import { ContextMenuProvider } from '/@/renderer/features/context-menu';
import { useDiscordRpc } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import { PlayQueueHandlerContext } from '/@/renderer/features/player';
import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import { useServerVersion } from '/@/renderer/hooks/use-server-version';
import { IsUpdatedDialog } from '/@/renderer/is-updated-dialog';
import { AppRouter } from '/@/renderer/router/app-router';
import {
    PlayerState,
    useCssSettings,
    useHotkeySettings,
    usePlaybackSettings,
    usePlayerStore,
    useQueueControls,
    useRemoteSettings,
    useSettingsStore,
} from '/@/renderer/store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { setQueue } from '/@/renderer/utils/set-transcoded-queue-data';
import { toast } from '/@/shared/components/toast/toast';
import { PlaybackType, PlayerStatus, WebAudio } from '/@/shared/types/types';

ModuleRegistry.registerModules([ClientSideRowModelModule, InfiniteRowModelModule]);

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;
const remote = isElectron() ? window.api.remote : null;
const utils = isElectron() ? window.api.utils : null;

export const App = () => {
    const { mode, theme } = useAppTheme();
    const language = useSettingsStore((store) => store.general.language);

    const { content, enabled } = useCssSettings();
    const { type: playbackType } = usePlaybackSettings();
    const { bindings } = useHotkeySettings();
    const handlePlayQueueAdd = useHandlePlayQueueAdd();
    const { clearQueue, restoreQueue } = useQueueControls();
    const remoteSettings = useRemoteSettings();
    const cssRef = useRef<HTMLStyleElement | null>(null);
    useDiscordRpc();
    useServerVersion();

    const [webAudio, setWebAudio] = useState<WebAudio>();

    useEffect(() => {
        if (enabled && content) {
            // Yes, CSS is sanitized here as well. Prevent a suer from changing the
            // localStorage to bypass sanitizing.
            const sanitized = sanitizeCss(content);
            if (!cssRef.current) {
                cssRef.current = document.createElement('style');
                document.body.appendChild(cssRef.current);
            }

            cssRef.current.textContent = sanitized;

            return () => {
                cssRef.current!.textContent = '';
            };
        }

        return () => {};
    }, [content, enabled]);

    const providerValue = useMemo(() => {
        return { handlePlayQueueAdd };
    }, [handlePlayQueueAdd]);

    const webAudioProvider = useMemo(() => {
        return { setWebAudio, webAudio };
    }, [webAudio]);

    // Start the mpv instance on startup
    useEffect(() => {
        const initializeMpv = async () => {
            if (playbackType === PlaybackType.LOCAL) {
                const isRunning: boolean | undefined = await mpvPlayer?.isRunning();

                mpvPlayer?.stop();

                if (!isRunning) {
                    const extraParameters = useSettingsStore.getState().playback.mpvExtraParameters;
                    const properties: Record<string, any> = {
                        speed: usePlayerStore.getState().speed,
                        ...getMpvProperties(useSettingsStore.getState().playback.mpvProperties),
                    };

                    await mpvPlayer?.initialize({
                        extraParameters,
                        properties,
                    });

                    mpvPlayer?.volume(properties.volume);
                }
            }

            utils?.restoreQueue();
        };

        if (isElectron()) {
            initializeMpv();
        }

        return () => {
            clearQueue();
            mpvPlayer?.stop();
            mpvPlayer?.cleanup();
        };
    }, [clearQueue, playbackType]);

    useEffect(() => {
        if (isElectron()) {
            ipc?.send('set-global-shortcuts', bindings);
        }
    }, [bindings]);

    useEffect(() => {
        if (utils) {
            utils.onSaveQueue(() => {
                const { current, queue } = usePlayerStore.getState();
                const stateToSave: Partial<Pick<PlayerState, 'current' | 'queue'>> = {
                    current: {
                        ...current,
                        status: PlayerStatus.PAUSED,
                    },
                    queue,
                };
                utils.saveQueue(stateToSave);
            });

            utils.onRestoreQueue((_event: any, data) => {
                const playerData = restoreQueue(data);
                if (playbackType === PlaybackType.LOCAL) {
                    setQueue(playerData, true);
                }
                updateSong(playerData.current.song);
            });
        }

        return () => {
            ipc?.removeAllListeners('renderer-restore-queue');
            ipc?.removeAllListeners('renderer-save-queue');
        };
    }, [playbackType, restoreQueue]);

    useEffect(() => {
        if (remote) {
            remote
                ?.updateSetting(
                    remoteSettings.enabled,
                    remoteSettings.port,
                    remoteSettings.username,
                    remoteSettings.password,
                )
                .catch((error) => {
                    toast.warn({ message: error, title: 'Failed to enable remote' });
                });
        }
        // We only want to fire this once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

    return (
        <MantineProvider
            defaultColorScheme={mode as 'dark' | 'light'}
            theme={theme}
        >
            <Notifications
                containerWidth="300px"
                position="bottom-center"
                zIndex={5}
            />
            <PlayQueueHandlerContext.Provider value={providerValue}>
                <ContextMenuProvider>
                    <WebAudioContext.Provider value={webAudioProvider}>
                        <AppRouter />
                    </WebAudioContext.Provider>{' '}
                </ContextMenuProvider>
            </PlayQueueHandlerContext.Provider>
            <IsUpdatedDialog />
        </MantineProvider>
    );
};
