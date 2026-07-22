import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Icon } from '/@/shared/components/icon/icon';
import {
    ServerListItem,
    ServerListItemWithCredential,
    ServerType,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const ServerSelectorItems = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentServer = useCurrentServer();
    const serverList = useServerList();
    const { logout, setCurrentServer, setMusicFolderId } = useAuthStoreActions();

    const { data: musicFolders } = useQuery(
        currentServer
            ? sharedQueries.musicFolders({ query: null, serverId: currentServer.id })
            : { enabled: false, queryKey: ['disabled'] },
    );

    const handleSetCurrentServer = (server: ServerListItemWithCredential) => {
        navigate(AppRoute.HOME);
        setCurrentServer(server);
        setMusicFolderId(undefined);
    };

    const handleCredentialsModal = async (server: ServerListItem) => {
        let password: null | string = null;

        try {
            if (localSettings && server.savePassword) {
                password = await localSettings.passwordGet(server.id);
            }
        } catch (error) {
            console.error(error);
        }

        openModal({
            children: (
                <EditServerForm
                    isUpdate
                    onCancel={closeAllModals}
                    password={password}
                    server={server}
                />
            ),
            size: 'sm',
            title: t('form.updateServer.title'),
        });
    };

    const supportsMultiSelect = hasFeature(currentServer, ServerFeature.MUSIC_FOLDER_MULTISELECT);

    const queryClient = useQueryClient();

    const handleToggleMusicFolder = (musicFolderId: string) => {
        if (supportsMultiSelect) {
            const currentIds = currentServer.musicFolderId || [];
            const isSelected = currentIds.includes(musicFolderId);

            if (isSelected) {
                // Remove from selection
                const newIds = currentIds.filter((id) => id !== musicFolderId);
                setMusicFolderId(newIds.length > 0 ? newIds : undefined);
            } else {
                // Add to selection
                setMusicFolderId([...currentIds, musicFolderId]);
            }
        } else {
            const currentId = Array.isArray(currentServer.musicFolderId)
                ? currentServer.musicFolderId[0]
                : currentServer.musicFolderId;
            const isSelected = currentId === musicFolderId;

            if (isSelected) {
                setMusicFolderId(undefined);
            } else {
                setMusicFolderId([musicFolderId]);
            }
        }

        queryClient.removeQueries();
    };

    const handleClearMusicFolders = () => {
        setMusicFolderId(undefined);
        queryClient.removeQueries();
    };

    if (!currentServer) {
        return null;
    }

    const selectedMusicFolders =
        musicFolders?.items.filter((folder) => currentServer.musicFolderId?.includes(folder.id)) ||
        [];

    const handleManageServersModal = () => {
        openModal({
            children: <ServerList />,
            title: t('page.manageServers.title'),
        });
    };

    const handleLogout = async () => {
        const serverId = currentServer.id;

        // Cancel in-flight requests before clearing credentials so they don't
        // retry/refetch with an empty token and surface auth error toasts.
        await queryClient.cancelQueries();
        localSettings?.passwordRemove(serverId);
        logout();

        // Defer cache clear until after authenticated routes unmount.
        setTimeout(() => {
            queryClient.clear();
        }, 0);
    };

    return (
        <>
            <DropdownMenu.Label>{t('page.appMenu.selectServer')}</DropdownMenu.Label>
            {Object.values(serverList).map((server) => {
                const isNavidromeExpired =
                    server.type === ServerType.NAVIDROME && !server.ndCredential;
                const isJellyfinExpired = server.type === ServerType.JELLYFIN && !server.credential;
                const isSubsonicExpired = server.type === ServerType.SUBSONIC && !server.credential;
                const isSessionExpired =
                    isNavidromeExpired || isJellyfinExpired || isSubsonicExpired;

                const logo =
                    server.type === ServerType.NAVIDROME
                        ? NavidromeLogo
                        : server.type === ServerType.JELLYFIN
                          ? JellyfinLogo
                          : OpenSubsonicLogo;

                return (
                    <DropdownMenu.Item
                        isSelected={currentServer?.id === server.id && !isSessionExpired}
                        key={`server-${server.id}`}
                        leftSection={<img src={logo} style={{ height: '1rem', width: '1rem' }} />}
                        onClick={() => {
                            if (isSessionExpired) {
                                handleCredentialsModal(server);
                            } else {
                                handleSetCurrentServer(server);
                            }
                        }}
                        rightSection={
                            isSessionExpired ? <Icon icon="lock" /> : <Icon icon="arrowRight" />
                        }
                    >
                        {server.name}
                    </DropdownMenu.Item>
                );
            })}
            {!isServerLock() && (
                <>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Item
                        leftSection={<Icon icon="edit" />}
                        onClick={handleManageServersModal}
                    >
                        {t('page.appMenu.manageServers')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        leftSection={<Icon color="error" icon="signOut" />}
                        onClick={handleLogout}
                    >
                        {t('page.appMenu.logout')}
                    </DropdownMenu.Item>
                </>
            )}
            {!isServerLock() && <></>}
            {musicFolders && musicFolders.items.length > 0 && (
                <>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Label>{t('page.appMenu.selectMusicFolder')}</DropdownMenu.Label>
                    <DropdownMenu.Item
                        isSelected={selectedMusicFolders.length === 0}
                        leftSection={<Icon icon="minus" />}
                        onClick={handleClearMusicFolders}
                    >
                        {t('common.none')}
                    </DropdownMenu.Item>
                    {musicFolders.items.map((folder) => {
                        const isSelected = supportsMultiSelect
                            ? currentServer.musicFolderId?.includes(folder.id) || false
                            : (Array.isArray(currentServer.musicFolderId)
                                  ? currentServer.musicFolderId[0]
                                  : currentServer.musicFolderId) === folder.id;
                        return (
                            <DropdownMenu.Item
                                isSelected={isSelected}
                                key={`musicFolder-${folder.id}`}
                                leftSection={<Icon icon={isSelected ? 'check' : 'folder'} />}
                                onClick={() => handleToggleMusicFolder(folder.id)}
                            >
                                {folder.name}
                            </DropdownMenu.Item>
                        );
                    })}
                </>
            )}
        </>
    );
};
