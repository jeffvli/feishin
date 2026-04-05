import { openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import packageJson from '../../../package.json';

import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { openSettingsModal } from '/@/renderer/features/settings/utils/open-settings-modal';
import { openReleaseNotesModal } from '/@/renderer/release-notes-modal';
import {
    useAppStore,
    useAppStoreActions,
    useCommandPalette,
    usePlayerHydrated,
    usePlayerRepeat,
    usePlayerShuffle,
    usePlayerStatus,
} from '/@/renderer/store';
import { PlayerShuffle } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;

export const useNativeMenuSync = () => {
    const { t } = useTranslation();
    const privateMode = useAppStore((state) => state.privateMode);
    const sidebar = useAppStore((state) => state.sidebar);
    const { setPrivateMode, setSideBar } = useAppStoreActions();
    const { open: openCommandPalette } = useCommandPalette();
    const playerHydrated = usePlayerHydrated();
    const playerRepeat = usePlayerRepeat();
    const playerShuffle = usePlayerShuffle();
    const playerStatus = usePlayerStatus();

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererOpenSettings(() => {
            openSettingsModal();
        });

        return () => {
            ipc?.removeAllListeners('renderer-open-settings');
        };
    }, []);

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererOpenCommandPalette(() => {
            openCommandPalette();
        });

        return () => {
            ipc?.removeAllListeners('renderer-open-command-palette');
        };
    }, [openCommandPalette]);

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererOpenManageServers(() => {
            openModal({
                children: <ServerList />,
                title: t('page.manageServers.title', { postProcess: 'titleCase' }),
            });
        });

        return () => {
            ipc?.removeAllListeners('renderer-open-manage-servers');
        };
    }, [t]);

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererTogglePrivateMode(() => {
            setPrivateMode(!privateMode);
        });

        return () => {
            ipc?.removeAllListeners('renderer-toggle-private-mode');
        };
    }, [privateMode, setPrivateMode]);

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererToggleSidebar(() => {
            setSideBar({ collapsed: !sidebar.collapsed });
        });

        return () => {
            ipc?.removeAllListeners('renderer-toggle-sidebar');
        };
    }, [setSideBar, sidebar.collapsed]);

    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        if (!playerHydrated) {
            return;
        }

        ipc?.send('update-playback', playerStatus);
        ipc?.send('update-repeat', playerRepeat);
        ipc?.send('update-shuffle', playerShuffle !== PlayerShuffle.NONE);
    }, [playerHydrated, playerRepeat, playerShuffle, playerStatus]);

    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        ipc?.send('update-private-mode', privateMode);
    }, [privateMode]);

    useEffect(() => {
        if (!isElectron()) {
            return;
        }

        ipc?.send('update-sidebar-collapsed', sidebar.collapsed);
    }, [sidebar.collapsed]);

    useEffect(() => {
        if (!isElectron()) {
            return undefined;
        }

        window.api.utils.rendererOpenReleaseNotes(() => {
            openReleaseNotesModal(
                t('common.newVersion', {
                    postProcess: 'sentenceCase',
                    version: packageJson.version,
                }) as string,
            );
        });

        return () => {
            ipc?.removeAllListeners('renderer-open-release-notes');
        };
    }, [t]);
};
