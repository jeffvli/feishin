/* eslint-disable perfectionist/sort-imports */
import { MantineProvider } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import 'overlayscrollbars/overlayscrollbars.css';
import '/styles/overlayscrollbars.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import isElectron from 'is-electron';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import packageJson from '../../package.json';

import i18n from '/@/i18n/i18n';
import { openSettingsModal } from '/@/renderer/features/settings/utils/open-settings-modal';
import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import { useSyncSettingsToMain } from '/@/renderer/hooks/use-sync-settings-to-main';
import { AppRouter } from '/@/renderer/router/app-router';
import {
    useAppStore,
    useAppStoreActions,
    useCommandPalette,
    useCssSettings,
    useHotkeySettings,
    useLanguage,
} from '/@/renderer/store';
import { useAppTheme } from '/@/renderer/themes/use-app-theme';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { WebAudio } from '/@/shared/types/types';
import '/@/shared/styles/global.css';
import { PlayerProvider } from '/@/renderer/features/player/context/player-context';
import { AudioPlayers } from '/@/renderer/features/player/components/audio-players';

const ReleaseNotesModal = lazy(() =>
    import('./release-notes-modal').then((module) => ({
        default: module.ReleaseNotesModal,
    })),
);

const ipc = isElectron() ? window.api.ipc : null;

export const App = () => {
    const { mode, theme } = useAppTheme();
    const language = useLanguage();
    const { t } = useTranslation();

    const { content, enabled } = useCssSettings();
    const { bindings } = useHotkeySettings();
    const cssRef = useRef<HTMLStyleElement | null>(null);

    const privateMode = useAppStore((state) => state.privateMode);
    const sidebar = useAppStore((state) => state.sidebar);
    const { setPrivateMode, setSideBar } = useAppStoreActions();
    const { open: openCommandPalette } = useCommandPalette();

    useSyncSettingsToMain();

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

    const webAudioProvider = useMemo(() => {
        return { setWebAudio, webAudio };
    }, [webAudio]);

    useEffect(() => {
        if (isElectron()) {
            ipc?.send('set-global-shortcuts', bindings);
        }
    }, [bindings]);

    useEffect(() => {
        if (language) {
            i18n.changeLanguage(language);
        }
    }, [language]);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererOpenSettings(() => {
                openSettingsModal();
            });

            return () => {
                ipc?.removeAllListeners('renderer-open-settings');
            };
        }
        return undefined;
    }, []);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererOpenCommandPalette(() => {
                openCommandPalette();
            });

            return () => {
                ipc?.removeAllListeners('renderer-open-command-palette');
            };
        }
        return () => {};
    }, [openCommandPalette]);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererOpenManageServers(() => {
                openModal({
                    children: <ServerList />,
                    title: t('page.manageServers.title', { postProcess: 'titleCase' }),
                });
            });

            return () => {
                ipc?.removeAllListeners('renderer-open-manage-servers');
            };
        }
        return () => {};
    }, [t]);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererTogglePrivateMode(() => {
                const newPrivateMode = !privateMode;
                setPrivateMode(newPrivateMode);
            });

            return () => {
                ipc?.removeAllListeners('renderer-toggle-private-mode');
            };
        }
        return () => {};
    }, [privateMode, setPrivateMode, t]);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererToggleSidebar(() => {
                const newCollapseSidebar = !sidebar.collapsed;
                setSideBar({ collapsed: newCollapseSidebar });
            });

            return () => {
                ipc?.removeAllListeners('renderer-toggle-sidebar');
            };
        }
        return () => {};
    }, [sidebar, setSideBar, t]);

    useEffect(() => {
        if (isElectron()) {
            ipc?.send('update-sidebar-collapsed', sidebar.collapsed);
        }
    }, [sidebar]);

    useEffect(() => {
        if (isElectron()) {
            ipc?.send('update-private-mode', privateMode);
        }
    }, [privateMode]);

    useEffect(() => {
        if (isElectron()) {
            window.api.utils.rendererOpenReleaseNotes(() => {
                import('./release-notes-modal').then((module) => {
                    module.openReleaseNotesModal(
                        t('common.newVersion', {
                            postProcess: 'sentenceCase',
                            version: packageJson.version,
                        }) as string,
                    );
                });
            });

            return () => {
                ipc?.removeAllListeners('renderer-open-release-notes');
            };
        }

        return () => {};
    }, [t]);

    const notificationStyles = useMemo(
        () => ({
            root: {
                marginBottom: 90,
            },
        }),
        [],
    );

    return (
        <MantineProvider forceColorScheme={mode} theme={theme}>
            <Notifications
                containerWidth="300px"
                position="bottom-center"
                styles={notificationStyles}
                zIndex={50000}
            />
            <WebAudioContext.Provider value={webAudioProvider}>
                <PlayerProvider>
                    <AudioPlayers />
                    <AppRouter />
                </PlayerProvider>
            </WebAudioContext.Provider>
            <Suspense fallback={null}>
                <ReleaseNotesModal />
            </Suspense>
        </MantineProvider>
    );
};
