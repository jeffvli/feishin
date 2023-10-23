import { useEffect, useMemo, useRef } from 'react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import isElectron from 'is-electron';
import { initSimpleImg } from 'react-simple-img';
import { BaseContextModal, toast } from './components';
import { useTheme } from './hooks';
import { IsUpdatedDialog } from './is-updated-dialog';
import { AppRouter } from './router/app-router';
import {
    useHotkeySettings,
    usePlaybackSettings,
    useRemoteSettings,
    useSettingsStore,
} from './store/settings.store';
import './styles/global.scss';
import { ContextMenuProvider } from '/@/renderer/features/context-menu';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { PlayQueueHandlerContext } from '/@/renderer/features/player';
import { AddToPlaylistContextModal } from '/@/renderer/features/playlists';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import { PlayerState, usePlayerStore, useQueueControls } from '/@/renderer/store';
import { FontType, PlaybackType, PlayerStatus } from '/@/renderer/types';
import '@ag-grid-community/styles/ag-grid.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, InfiniteRowModelModule]);

initSimpleImg({ threshold: 0.05 }, true);

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.electron.mpvPlayerListener : null;
const ipc = isElectron() ? window.electron.ipc : null;
const remote = isElectron() ? window.electron.remote : null;

export const App = () => {
    const theme = useTheme();
    const contentFont = useSettingsStore((state) => state.general.fontContent);
    const accent = useSettingsStore((store) => store.general.accent);
    const { builtIn, custom, system, type } = useSettingsStore((state) => state.font);
    const { type: playbackType } = usePlaybackSettings();
    const { bindings } = useHotkeySettings();
    const handlePlayQueueAdd = useHandlePlayQueueAdd();
    const { clearQueue, restoreQueue } = useQueueControls();
    const remoteSettings = useRemoteSettings();
    const textStyleRef = useRef<HTMLStyleElement>();

    useEffect(() => {
        if (type === FontType.SYSTEM && system) {
            const root = document.documentElement;
            root.style.setProperty('--content-font-family', 'dynamic-font');

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: local("${system}");
            }`;
        } else if (type === FontType.CUSTOM && custom) {
            const root = document.documentElement;
            root.style.setProperty('--content-font-family', 'dynamic-font');

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: url("feishin://${custom}");
            }`;
        } else {
            const root = document.documentElement;
            root.style.setProperty('--content-font-family', builtIn);
        }
    }, [builtIn, custom, system, type]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', accent);
    }, [accent]);

    const providerValue = useMemo(() => {
        return { handlePlayQueueAdd };
    }, [handlePlayQueueAdd]);

    // Start the mpv instance on startup
    useEffect(() => {
        const initializeMpv = async () => {
            const isRunning: boolean | undefined = await mpvPlayer?.isRunning();

            mpvPlayer?.stop();

            if (!isRunning) {
                const extraParameters = useSettingsStore.getState().playback.mpvExtraParameters;
                const properties: Record<string, any> = {
                    speed: usePlayerStore.getState().current.speed,
                    ...getMpvProperties(useSettingsStore.getState().playback.mpvProperties),
                };

                mpvPlayer?.initialize({
                    extraParameters,
                    properties,
                });

                mpvPlayer?.volume(properties.volume);
            }
            mpvPlayer?.restoreQueue();
        };

        if (isElectron() && playbackType === PlaybackType.LOCAL) {
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
        if (isElectron()) {
            mpvPlayerListener!.rendererSaveQueue(() => {
                const { current, queue } = usePlayerStore.getState();
                const stateToSave: Partial<Pick<PlayerState, 'current' | 'queue'>> = {
                    current: {
                        ...current,
                        status: PlayerStatus.PAUSED,
                    },
                    queue,
                };
                mpvPlayer!.saveQueue(stateToSave);
            });

            mpvPlayerListener!.rendererRestoreQueue((_event: any, data) => {
                const playerData = restoreQueue(data);
                if (playbackType === PlaybackType.LOCAL) {
                    mpvPlayer!.setQueue(playerData, true);
                }
            });
        }

        return () => {
            ipc?.removeAllListeners('renderer-player-restore-queue');
            ipc?.removeAllListeners('renderer-player-save-queue');
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

    return (
        <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
                colorScheme: theme as 'light' | 'dark',
                components: {
                    Modal: {
                        styles: {
                            body: { background: 'var(--modal-bg)', padding: '1rem !important' },
                            close: { marginRight: '0.5rem' },
                            content: { borderRadius: '5px' },
                            header: {
                                background: 'var(--modal-header-bg)',
                                paddingBottom: '1rem',
                            },
                            title: { fontSize: 'medium', fontWeight: 500 },
                        },
                    },
                },
                defaultRadius: 'xs',
                dir: 'ltr',
                focusRing: 'auto',
                focusRingStyles: {
                    inputStyles: () => ({
                        border: '1px solid var(--primary-color)',
                    }),
                    resetStyles: () => ({ outline: 'none' }),
                    styles: () => ({
                        outline: '1px solid var(--primary-color)',
                        outlineOffset: '-1px',
                    }),
                },
                fontFamily: 'var(--content-font-family)',
                fontSizes: {
                    lg: '1.1rem',
                    md: '1rem',
                    sm: '0.9rem',
                    xl: '1.5rem',
                    xs: '0.8rem',
                },
                headings: {
                    fontFamily: 'var(--content-font-family)',
                    fontWeight: 700,
                },
                other: {},
                spacing: {
                    lg: '2rem',
                    md: '1rem',
                    sm: '0.5rem',
                    xl: '4rem',
                    xs: '0rem',
                },
            }}
        >
            <ModalsProvider
                modalProps={{
                    centered: true,
                    styles: {
                        body: { position: 'relative' },
                        content: { overflow: 'auto' },
                    },
                    transitionProps: {
                        duration: 300,
                        exitDuration: 300,
                        transition: 'fade',
                    },
                }}
                modals={{ addToPlaylist: AddToPlaylistContextModal, base: BaseContextModal }}
            >
                <PlayQueueHandlerContext.Provider value={providerValue}>
                    <ContextMenuProvider>
                        <AppRouter />
                    </ContextMenuProvider>
                </PlayQueueHandlerContext.Provider>
            </ModalsProvider>
            <IsUpdatedDialog />
        </MantineProvider>
    );
};
