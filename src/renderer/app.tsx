import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { MantineProvider } from '@mantine/core';
import isElectron from 'is-electron';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { initSimpleImg } from 'react-simple-img';

import './styles/global.scss';

import '@ag-grid-community/styles/ag-grid.css';
import 'overlayscrollbars/overlayscrollbars.css';

import i18n from '/@/i18n/i18n';
import { toast } from '/@/renderer/components';
import { ContextMenuProvider } from '/@/renderer/features/context-menu';
import { useDiscordRpc } from '/@/renderer/features/discord-rpc/use-discord-rpc';
import { PlayQueueHandlerContext } from '/@/renderer/features/player';
import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import { useTheme } from '/@/renderer/hooks';
import { useServerVersion } from '/@/renderer/hooks/use-server-version';
import { IsUpdatedDialog } from '/@/renderer/is-updated-dialog';
import { AppRouter } from '/@/renderer/router/app-router';
import {
    useCssSettings,
    useHotkeySettings,
    usePlaybackSettings,
    usePlayerStore,
    useQueueControls,
    useRemoteSettings,
    useSettingsStore,
} from '/@/renderer/store';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { setQueue } from '/@/renderer/utils/set-transcoded-queue-data';
import { FontType, PlaybackType, PlayerStatus, WebAudio } from '/@/shared/types/types';

ModuleRegistry.registerModules([ClientSideRowModelModule, InfiniteRowModelModule]);

initSimpleImg({ threshold: 0.05 }, true);

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const ipc = isElectron() ? window.api.ipc : null;
const remote = isElectron() ? window.api.remote : null;
const utils = isElectron() ? window.api.utils : null;

export const App = () => {
    const theme = useTheme();
    const accent = useSettingsStore((store) => store.general.accent);
    const language = useSettingsStore((store) => store.general.language);
    const nativeImageAspect = useSettingsStore((store) => store.general.nativeAspectRatio);
    const { builtIn, custom, system, type } = useSettingsStore((state) => state.font);
    const { content, enabled } = useCssSettings();
    const { type: playbackType } = usePlaybackSettings();
    const { bindings } = useHotkeySettings();
    const handlePlayQueueAdd = useHandlePlayQueueAdd();
    const { clearQueue, restoreQueue } = useQueueControls();
    const remoteSettings = useRemoteSettings();
    const textStyleRef = useRef<HTMLStyleElement | null>(null);
    const cssRef = useRef<HTMLStyleElement | null>(null);
    const reloadStateHandled = useRef(false);
    const playerQueue = usePlayerStore((state) => state.queue);
    const playerCurrent = usePlayerStore((state) => state.current);
    const generalSettingShouldResume = useSettingsStore((state) => state.general.resume);
    const { index, nextIndex, shuffledIndex, song } = playerCurrent;

    const savePlayerQueueState = useCallback(() => {
        const data = {
            current: {
                index,
                nextIndex,
                shuffledIndex,
                song,
                status: PlayerStatus.PAUSED,
                time: 0,
            },
            queue: playerQueue,
        };
        utils?.saveQueue(data);
    }, [index, nextIndex, shuffledIndex, song, playerQueue]);

    useEffect(() => {
        if (!reloadStateHandled.current) {
            return;
        }
        if (!generalSettingShouldResume) {
            return;
        }
        savePlayerQueueState();
    }, [generalSettingShouldResume, savePlayerQueueState]);

    useEffect(() => {
        if (reloadStateHandled.current === false && generalSettingShouldResume) {
            utils?.restoreQueue();
        } else {
            reloadStateHandled.current = !generalSettingShouldResume;
        }
    }, [generalSettingShouldResume]);
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
            utils.onRestoreQueue((_event: any, data) => {
                const playerData = restoreQueue(data);
                if (playbackType === PlaybackType.LOCAL) {
                    setQueue(playerData, true);
                }
                updateSong(playerData.current.song);
                reloadStateHandled.current = true;
            });
            utils.onRestoreQueueFail(() => {
                reloadStateHandled.current = true;
            });
        }

        return () => {
            ipc?.removeAllListeners('renderer-restore-queue');
            ipc?.removeAllListeners('renderer-restore-queue-fail');
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
            theme={{
                colorScheme: theme as 'dark' | 'light',
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
            withGlobalStyles
            withNormalizeCSS
        >
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
