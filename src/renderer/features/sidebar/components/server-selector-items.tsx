import { openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { ServerList } from '/@/renderer/features/servers/components/server-list';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Icon } from '/@/shared/components/icon/icon';
import { ServerListItemWithCredential, ServerType } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

export const ServerSelectorItems = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentServer = useCurrentServer();
    const serverList = useServerList();
    const { setCurrentServer, setMusicFolderId } = useAuthStoreActions();

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

        queryClient.resetQueries();
    };

    const handleClearMusicFolders = () => {
        setMusicFolderId(undefined);
        queryClient.resetQueries();
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
            title: t('page.manageServers.title', { postProcess: 'titleCase' }),
        });
    };

    return (
        <>
            <DropdownMenu.Label>
                {t('page.appMenu.selectServer', { postProcess: 'titleCase' })}
            </DropdownMenu.Label>
            {Object.values(serverList).map((server) => {
                const isNavidromeExpired =
                    server.type === ServerType.NAVIDROME && !server.ndCredential;
                const isJellyfinExpired = server.type === ServerType.JELLYFIN && !server.credential;
                const isSessionExpired = isNavidromeExpired || isJellyfinExpired;

                const logo =
                    server.type === ServerType.NAVIDROME
                        ? NavidromeLogo
                        : server.type === ServerType.JELLYFIN
                          ? JellyfinLogo
                          : OpenSubsonicLogo;

                return (
                    <DropdownMenu.Item
                        isSelected={currentServer?.id === server.id}
                        key={`server-${server.id}`}
                        leftSection={<img src={logo} style={{ height: '1rem', width: '1rem' }} />}
                        onClick={() => {
                            if (!isSessionExpired) {
                                handleSetCurrentServer(server);
                            }
                        }}
                    >
                        {server.name}
                    </DropdownMenu.Item>
                );
            })}
            <DropdownMenu.Item
                leftSection={<Icon icon="edit" />}
                onClick={handleManageServersModal}
            >
                {t('page.appMenu.manageServers', { postProcess: 'sentenceCase' })}
            </DropdownMenu.Item>
            {musicFolders && musicFolders.items.length > 0 && (
                <>
                    <DropdownMenu.Divider />
                    <DropdownMenu.Label>
                        {t('page.appMenu.selectMusicFolder', { postProcess: 'sentenceCase' })}
                    </DropdownMenu.Label>
                    <DropdownMenu.Item
                        isSelected={selectedMusicFolders.length === 0}
                        leftSection={<Icon icon="minus" />}
                        onClick={handleClearMusicFolders}
                    >
                        {t('common.none', { postProcess: 'titleCase' })}
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
