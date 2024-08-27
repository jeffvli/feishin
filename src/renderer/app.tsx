import { useEffect, useMemo, useRef } from 'react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { MantineProvider } from '@mantine/core';
import isElectron from 'is-electron';
import { initSimpleImg } from 'react-simple-img';
import { toast } from './components';
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
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import { PlayerState, useCssSettings, usePlayerStore, useQueueControls } from '/@/renderer/store';
import { FontType, PlaybackType, PlayerStatus } from '/@/renderer/types';
import '@ag-grid-community/styles/ag-grid.css';
import { useDiscordRpc } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import i18n from '/@/i18n/i18n';
import { useServerVersion } from '/@/renderer/hooks/use-server-version';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { sanitizeCss } from '/@/renderer/utils/sanitize';

ModuleRegistry.registerModules([ClientSideRowModelModule, InfiniteRowModelModule]);

initSimpleImg({ threshold: 0.05 }, true);

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const ipc = isElectron() ? window.electron.ipc : null;
const remote = isElectron() ? window.electron.remote : null;
const utils = isElectron() ? window.electron.utils : null;

export const App = () => {
    const theme = useTheme();
    const accent = useSettingsStore((store) => store.general.accent);
    const language = useSettingsStore((store) => store.general.language);
    const nativeImageAspect = useSettingsStore((store) => store.general.nativeAspectRatio);
    const { builtIn, custom, system, type } = useSettingsStore((state) => state.font);
    const { enabled, content } = useCssSettings();
    const { type: playbackType } = usePlaybackSettings();
    const { bindings } = useHotkeySettings();
    const handlePlayQueueAdd = useHandlePlayQueueAdd();
    const { clearQueue, restoreQueue } = useQueueControls();
    const remoteSettings = useRemoteSettings();
    const textStyleRef = useRef<HTMLStyleElement>();
    const cssRef = useRef<HTMLStyleElement>();
    useDiscordRpc();
    useServerVersion();

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

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', accent);
    }, [accent]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--image-fit', nativeImageAspect ? 'contain' : 'cover');
    }, [nativeImageAspect]);

    const providerValue = useMemo(() => {
        return { handlePlayQueueAdd };
    }, [handlePlayQueueAdd]);

    // Start the mpv instance on startup
    useEffect(() => {
        const initializeMpv = async () => {
            if (playbackType === PlaybackType.LOCAL) {
                const isRunning: boolean | undefined = await mpvPlayer?.isRunning();

                mpvPlayer?.stop();

                if (!isRunning) {
                    const extraParameters = useSettingsStore.getState().playback.mpvExtraParameters;
                    const properties: Record<string, any> = {
                        speed: usePlayerStore.getState().current.speed,
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
                    mpvPlayer!.setQueue(playerData, true);
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
            <PlayQueueHandlerContext.Provider value={providerValue}>
                <ContextMenuProvider>
                    <AppRouter />
                </ContextMenuProvider>
            </PlayQueueHandlerContext.Provider>
            <IsUpdatedDialog />
        </MantineProvider>
    );
};
