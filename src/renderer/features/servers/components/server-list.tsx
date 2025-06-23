import { useLocalStorage } from '@mantine/hooks';
import { openContextModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import JellyfinLogo from '/@/renderer/features/servers/assets/jellyfin.png';
import NavidromeLogo from '/@/renderer/features/servers/assets/navidrome.png';
import OpenSubsonicLogo from '/@/renderer/features/servers/assets/opensubsonic.png';
import { AddServerForm } from '/@/renderer/features/servers/components/add-server-form';
import { ServerListItem } from '/@/renderer/features/servers/components/server-list-item';
import { useCurrentServer, useServerList } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ContextModalVars } from '/@/shared/components/modal/modal';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { ServerType } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

export const ServerList = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const serverListQuery = useServerList();

    const handleAddServerModal = () => {
        openContextModal({
            innerProps: {
                modalBody: (vars: ContextModalVars) => (
                    <AddServerForm onCancel={() => vars.context.closeModal(vars.id)} />
                ),
            },
            modal: 'base',
            title: t('form.addServer.title', { postProcess: 'titleCase' }),
        });
    };

    const [ignoreCORS, setIgnoreCORS] = useLocalStorage({
        defaultValue: 'false',
        key: 'ignore_cors',
    });

    const [ignoreSSL, setIgnoreSSL] = useLocalStorage({
        defaultValue: 'false',
        key: 'ignore_ssl',
    });

    const handleUpdateIgnoreCORS = (e: ChangeEvent<HTMLInputElement>) => {
        setIgnoreCORS(String(e.currentTarget.checked));

        if (isElectron()) {
            localSettings?.set('ignore_cors', e.currentTarget.checked);
        }
    };

    const handleUpdateIgnoreSSL = (e: ChangeEvent<HTMLInputElement>) => {
        setIgnoreSSL(String(e.currentTarget.checked));

        if (isElectron()) {
            localSettings?.set('ignore_ssl', e.currentTarget.checked);
        }
    };

    return (
        <>
            <Stack>
                <Accordion variant="separated">
                    {Object.keys(serverListQuery)?.map((serverId) => {
                        const server = serverListQuery[serverId];
                        return (
                            <Accordion.Item
                                key={server.id}
                                value={server.name}
                            >
                                <Accordion.Control>
                                    <Group>
                                        <img
                                            src={
                                                server.type === ServerType.NAVIDROME
                                                    ? NavidromeLogo
                                                    : server.type === ServerType.JELLYFIN
                                                      ? JellyfinLogo
                                                      : OpenSubsonicLogo
                                            }
                                            style={{
                                                height: 'var(--theme-font-size-lg)',
                                                width: 'var(--theme-font-size-lg)',
                                            }}
                                        />
                                        <Text fw={server.id === currentServer?.id ? 600 : 400}>
                                            {server?.name}
                                        </Text>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <ServerListItem server={server} />
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                    <Group
                        grow
                        pt="md"
                    >
                        <Button
                            autoFocus
                            leftSection={<Icon icon="add" />}
                            onClick={handleAddServerModal}
                        >
                            {t('form.addServer.title', { postProcess: 'titleCase' })}
                        </Button>
                    </Group>
                </Accordion>
                {isElectron() && (
                    <>
                        <Divider />
                        <Group>
                            <Switch
                                checked={ignoreCORS === 'true'}
                                label={t('form.addServer.ignoreCors', {
                                    postProcess: 'sentenceCase',
                                })}
                                onChange={handleUpdateIgnoreCORS}
                            />
                        </Group>
                        <Group>
                            <Switch
                                checked={ignoreSSL === 'true'}
                                label={t('form.addServer.ignoreSsl', {
                                    postProcess: 'sentenceCase',
                                })}
                                onChange={handleUpdateIgnoreSSL}
                            />
                        </Group>
                    </>
                )}
            </Stack>
        </>
    );
};
