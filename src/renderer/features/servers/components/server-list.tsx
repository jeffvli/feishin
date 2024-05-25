import { ChangeEvent } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { Accordion, Button, ContextModalVars, Switch, Text } from '/@/renderer/components';
import { useLocalStorage } from '@mantine/hooks';
import { openContextModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiAddFill, RiServerFill } from 'react-icons/ri';
import { AddServerForm } from '/@/renderer/features/servers/components/add-server-form';
import { ServerListItem } from '/@/renderer/features/servers/components/server-list-item';
import { useCurrentServer, useServerList } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const ServerList = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const serverListQuery = useServerList();

    const handleAddServerModal = () => {
        openContextModal({
            innerProps: {
                // eslint-disable-next-line react/no-unstable-nested-components
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
            <Group
                justify="flex-end"
                mb={10}
                style={{
                    position: 'absolute',
                    right: 55,
                    transform: 'translateY(-3.5rem)',
                    zIndex: 2000,
                }}
            >
                <Button
                    autoFocus
                    leftSection={<RiAddFill size={15} />}
                    size="compact-sm"
                    variant="filled"
                    onClick={handleAddServerModal}
                >
                    {t('form.addServer.title', { postProcess: 'titleCase' })}
                </Button>
            </Group>
            <Stack>
                <Accordion variant="separated">
                    {Object.keys(serverListQuery)?.map((serverId) => {
                        const server = serverListQuery[serverId];
                        return (
                            <Accordion.Item
                                key={server.id}
                                value={server.name}
                            >
                                <Accordion.Control icon={<RiServerFill size={15} />}>
                                    <Group justify="space-between">
                                        <Text weight={server.id === currentServer?.id ? 800 : 400}>
                                            {titleCase(server?.type)} - {server?.name}
                                        </Text>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <ServerListItem server={server} />
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
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
