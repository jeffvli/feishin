import { closeAllModals, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import styles from '/@/renderer/features/action-required/components/server-required.module.css';
import { isServerLock } from '/@/renderer/features/action-required/utils/window-properties';
import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { AddServerForm } from '/@/renderer/features/servers/components/add-server-form';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import {
    ServerListItem,
    ServerListItemWithCredential,
    ServerType,
} from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const ServerRequired = () => {
    const serverList = useServerList();

    if (Object.keys(serverList).length > 0) {
        return (
            <ScrollArea>
                <Stack className={styles.list}>
                    <ServerSelector />
                    {!isServerLock() && (
                        <>
                            <Divider my="lg" />
                            <AddServerForm onCancel={null} />
                        </>
                    )}
                </Stack>
            </ScrollArea>
        );
    }

    return <AddServerForm onCancel={null} />;
};

function ServerSelector() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const serverList = useServerList();
    const currentServer = useCurrentServer();
    const { setCurrentServer } = useAuthStoreActions();

    const handleSetCurrentServer = (server: ServerListItemWithCredential) => {
        navigate(AppRoute.HOME);
        setCurrentServer(server);
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
            children: server && (
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

    return (
        <>
            {Object.keys(serverList).map((serverId) => {
                const server = serverList[serverId];
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
                    <Button
                        classNames={{
                            label: styles.serverButtonLabel,
                            root: styles.serverButton,
                        }}
                        key={`server-${server.id}`}
                        onClick={() => {
                            if (!isSessionExpired) return handleSetCurrentServer(server);
                            return handleCredentialsModal(server);
                        }}
                        size="lg"
                        variant={
                            server.id === currentServer?.id && !isSessionExpired
                                ? 'filled'
                                : 'default'
                        }
                    >
                        <Group className={styles.serverRow} justify="space-between">
                            <Group>
                                <img alt="" className={styles.serverLogo} src={logo} />
                                <Text fw={600} size="lg">
                                    {server.name}
                                </Text>
                            </Group>
                            {isSessionExpired ? <Icon icon="lock" /> : <Icon icon="arrowRight" />}
                        </Group>
                    </Button>
                );
            })}
        </>
    );
}
