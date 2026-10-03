import { useTranslation } from 'react-i18next';

import styles from './server-selector.module.css';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { useScanStatus } from '/@/renderer/features/shared/hooks/use-scan-status';
import { useServerLibraryControls } from '/@/renderer/features/shared/hooks/use-server-library-controls';
import { ServerSelectorItems } from '/@/renderer/features/sidebar/components/server-selector-items';
import { useCurrentServer } from '/@/renderer/store';
import { Box } from '/@/shared/components/box/box';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { ServerType } from '/@/shared/types/domain-types';

export const ServerSelector = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const { data: scanStatus, isScanning, isWatching } = useScanStatus();

    const { selectedMusicFolders, supportsMultiSelect } = useServerLibraryControls();

    if (!currentServer) {
        return null;
    }

    const musicFolderDisplayText = (() => {
        if (selectedMusicFolders.length === 0) {
            return t('page.appMenu.noMusicFolder');
        }

        if (supportsMultiSelect && selectedMusicFolders.length > 1) {
            return t('page.appMenu.multipleMusicFolders', {
                count: selectedMusicFolders.length,
            });
        }

        return selectedMusicFolders[0].name;
    })();

    const scanProgressParts: string[] = [];
    if (scanStatus?.count && scanStatus.count > 0) {
        scanProgressParts.push(t('common.scanItemCount', { count: scanStatus.count }));
    }
    if (scanStatus?.folderCount && scanStatus.folderCount > 0) {
        scanProgressParts.push(t('common.scanFolderCount', { count: scanStatus.folderCount }));
    }

    const scanStatusText =
        isWatching && isScanning
            ? [t('common.scanningLibrary'), ...scanProgressParts].filter(Boolean).join(' · ')
            : null;

    const logo =
        currentServer.type === ServerType.NAVIDROME
            ? NavidromeLogo
            : currentServer.type === ServerType.JELLYFIN
              ? JellyfinLogo
              : OpenSubsonicLogo;

    return (
        <DropdownMenu offset={0} position="right-start" withinPortal={false}>
            <DropdownMenu.Target>
                <div
                    aria-label={t('page.appMenu.manageServers')}
                    className={styles.popoverTarget}
                    role="button"
                    tabIndex={0}
                >
                    <Box className={styles.buttonContainer}>
                        <Group className={styles.buttonGroup} gap="sm">
                            <img className={styles.logo} src={logo} />
                            <Stack className={styles.buttonStack} gap={2}>
                                <Text fw={600} size="sm" truncate>
                                    {currentServer.name}
                                </Text>
                                <Text isMuted size="xs" truncate>
                                    {musicFolderDisplayText}
                                </Text>
                                {scanStatusText && (
                                    <Text isMuted size="xs" truncate>
                                        {scanStatusText}
                                    </Text>
                                )}
                            </Stack>
                            <Icon icon="ellipsisVertical" size="sm" />
                        </Group>
                    </Box>
                </div>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown miw="16rem">
                <ScrollArea className={styles.scrollArea}>
                    <ServerSelectorItems />
                </ScrollArea>
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};
