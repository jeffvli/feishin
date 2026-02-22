import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './server-selector.module.css';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { ServerSelectorItems } from '/@/renderer/features/sidebar/components/server-selector-items';
import { useAppStore, useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Box } from '/@/shared/components/box/box';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { ServerType } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

export const ServerSelector = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const sidebarImageEnabled = useAppStore((state) => state.sidebar.image);
    const showImage = sidebarImageEnabled;

    const { data: musicFolders } = useQuery(
        currentServer
            ? sharedQueries.musicFolders({ query: null, serverId: currentServer.id })
            : { enabled: false, queryKey: ['disabled'] },
    );

    const targetRef = useRef<HTMLDivElement | null>(null);
    const widthOfTarget = targetRef.current?.getBoundingClientRect().width;

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
        <DropdownMenu offset={0} position="top">
            <DropdownMenu.Target>
                <div className={styles.popoverTarget}>
                    <Box
                        className={`${styles.buttonContainer} ${
                            showImage ? styles.buttonContainerNoBottomPadding : ''
                        }`}
                    >
                        <Group className={styles.buttonGroup} gap="sm" ref={targetRef}>
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
            <DropdownMenu.Dropdown style={{ width: `${widthOfTarget}px` }}>
                <ScrollArea style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <ServerSelectorItems />
                </ScrollArea>
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
