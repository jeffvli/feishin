import { closeAllModals, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AddServerForm } from '/@/renderer/features/servers';
import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { AppRoute } from '/@/renderer/router/routes';
import { useAuthStoreActions, useCurrentServer, useServerList } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { ServerListItem, ServerType } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const ServerRequired = () => {
    const { t } = useTranslation();
    const serverList = useServerList();

    const serverLock =
        (localSettings
            ? !!localSettings.env.SERVER_LOCK
            : !!window.SERVER_LOCK &&
              window.SERVER_TYPE &&
              window.SERVER_NAME &&
              window.SERVER_URL) || false;

    if (Object.keys(serverList).length > 0) {
        return (
            <ScrollArea>
                <Stack miw="300px">
                    <ServerSelector />
                    {serverLock && (
                        <>
                            <Divider my="lg" />
                            <Accordion>
                                <Accordion.Item value="add-server">
                                    <Accordion.Control>
                                        {t('form.addServer.title', { postProcess: 'titleCase' })}
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <AddServerForm onCancel={null} />
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
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

    const handleSetCurrentServer = (server: ServerListItem) => {
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
            title: t('form.updateServer.title', { postProcess: 'titleCase' }),
        });
    };

    return (
        <>
            {Object.keys(serverList).map((serverId) => {
                const server = serverList[serverId];
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
                    <Button
                        key={`server-${server.id}`}
                        onClick={() => {
                            if (!isSessionExpired) return handleSetCurrentServer(server);
                            return handleCredentialsModal(server);
                        }}
                        size="lg"
                        styles={{
                            label: {
                                width: '100%',
                            },
                            root: {
                                padding: 'var(--theme-spacing-sm)',
                            },
                        }}
                        variant={server.id === currentServer?.id ? 'filled' : 'default'}
                    >
                        <Group
                            justify="space-between"
                            w="100%"
                        >
                            <Group>
                                <img
                                    src={logo}
                                    style={{
                                        height: 'var(--theme-font-size-2xl)',
                                        width: 'var(--theme-font-size-2xl)',
                                    }}
                                />
                                <Text
                                    fw={600}
                                    size="lg"
                                >
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
