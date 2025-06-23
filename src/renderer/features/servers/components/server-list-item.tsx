import { useDisclosure } from '@mantine/hooks';
import isElectron from 'is-electron';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '/@/renderer/features/servers/components/server-section';
import { useAuthStoreActions } from '/@/renderer/store';
import { Button, TimeoutButton } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { ServerListItem as ServerItem } from '/@/shared/types/domain-types';

const localSettings = isElectron() ? window.api.localSettings : null;

interface ServerListItemProps {
    server: ServerItem;
}

export const ServerListItem = ({ server }: ServerListItemProps) => {
    const { t } = useTranslation();
    const [edit, editHandlers] = useDisclosure(false);
    const [savedPassword, setSavedPassword] = useState('');
    const { deleteServer } = useAuthStoreActions();

    const handleDeleteServer = () => {
        deleteServer(server.id);
        localSettings?.passwordRemove(server.name);
    };

    const handleEdit = useCallback(() => {
        if (!edit && localSettings && server.savePassword) {
            localSettings
                .passwordGet(server.id)
                .then((password: null | string) => {
                    if (password) {
                        setSavedPassword(password);
                    } else {
                        setSavedPassword('');
                    }
                    editHandlers.open();
                    return null;
                })
                .catch((error: any) => {
                    console.error(error);
                    setSavedPassword('');
                    editHandlers.open();
                });
        } else {
            setSavedPassword('');
            editHandlers.open();
        }
    }, [edit, editHandlers, server.id, server.savePassword]);

    return (
        <Stack>
            <ServerSection title={null}>
                {edit ? (
                    <EditServerForm
                        onCancel={() => editHandlers.toggle()}
                        password={savedPassword}
                        server={server}
                    />
                ) : (
                    <Stack>
                        <Table
                            layout="fixed"
                            variant="vertical"
                            withTableBorder
                        >
                            <Table.Tbody>
                                <Table.Tr>
                                    <Table.Th>
                                        {t('page.manageServers.url', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    </Table.Th>
                                    <Table.Td>{server.url}</Table.Td>
                                </Table.Tr>
                                <Table.Tr>
                                    <Table.Th>
                                        {t('page.manageServers.username', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    </Table.Th>
                                    <Table.Td>{server.username}</Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                        <Group grow>
                            <Button
                                leftSection={<Icon icon="edit" />}
                                onClick={() => handleEdit()}
                                tooltip={{
                                    label: t('page.manageServers.editServerDetailsTooltip', {
                                        postProcess: 'sentenceCase',
                                    }),
                                }}
                            >
                                {t('common.edit', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </ServerSection>
            <Divider my="sm" />
            <TimeoutButton
                leftSection={<Icon icon="delete" />}
                timeoutProps={{ callback: handleDeleteServer, duration: 1000 }}
                variant="state-error"
            >
                {t('page.manageServers.removeServer', { postProcess: 'sentenceCase' })}
            </TimeoutButton>
        </Stack>
    );
};
