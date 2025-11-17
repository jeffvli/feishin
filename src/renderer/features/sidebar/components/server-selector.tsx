import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import styles from './server-selector.module.css';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Box } from '/@/shared/components/box/box';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { ServerType } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface ServerSelectorProps {
    showImage?: boolean;
}

export const ServerSelector = ({ showImage = false }: ServerSelectorProps) => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();

    const { data: musicFolders } = useQuery(
        currentServer
            ? sharedQueries.musicFolders({ query: null, serverId: currentServer.id })
            : { enabled: false, queryKey: ['disabled'] },
    );

    if (!currentServer) {
        return null;
    }

    const supportsMultiSelect = hasFeature(currentServer, ServerFeature.MUSIC_FOLDER_MULTISELECT);

    const selectedMusicFolders =
        musicFolders?.items.filter((folder) => currentServer.musicFolderId?.includes(folder.id)) ||
        [];

    const musicFolderDisplayText = (() => {
        if (selectedMusicFolders.length === 0) {
            return t('page.appMenu.noMusicFolder', { postProcess: 'sentenceCase' });
        }

        if (supportsMultiSelect && selectedMusicFolders.length > 1) {
            return t('page.appMenu.multipleMusicFolders', {
                count: selectedMusicFolders.length,
                postProcess: 'sentenceCase',
            });
        }

        return selectedMusicFolders[0].name;
    })();

    const logo =
        currentServer.type === ServerType.NAVIDROME
            ? NavidromeLogo
            : currentServer.type === ServerType.JELLYFIN
              ? JellyfinLogo
              : OpenSubsonicLogo;

    return (
        <DropdownMenu position="right">
            <DropdownMenu.Target>
                <div className={styles.popoverTarget}>
                    <Box
                        className={`${styles.buttonContainer} ${
                            showImage ? styles.buttonContainerNoBottomPadding : ''
                        }`}
                    >
                        <Group className={styles.buttonGroup} gap="sm">
                            <img className={styles.logo} src={logo} />
                            <Stack className={styles.buttonStack} gap={2}>
                                <Text fw={600} size="sm" truncate>
                                    {currentServer.name}
                                </Text>
                                <Text isMuted size="xs" truncate>
                                    {musicFolderDisplayText}
                                </Text>
                            </Stack>
                            <Icon icon="ellipsisVertical" size="sm" />
                        </Group>
                    </Box>
                </div>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <AppMenu />
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
