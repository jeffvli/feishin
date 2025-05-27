import { useDisclosure } from '@mantine/hooks';
import isElectron from 'is-electron';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiDeleteBin2Line, RiEdit2Fill } from 'react-icons/ri';

import { EditServerForm } from '/@/renderer/features/servers/components/edit-server-form';
import { ServerSection } from '/@/renderer/features/servers/components/server-section';
import { useAuthStoreActions } from '/@/renderer/store';
import { Button, TimeoutButton } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
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
            <ServerSection
                title={
                    <Group justify="space-between">
                        <Text>
                            {t('page.manageServers.serverDetails', {
                                postProcess: 'sentenceCase',
                            })}
                        </Text>
                    </Group>
                }
            >
                {edit ? (
                    <EditServerForm
                        onCancel={() => editHandlers.toggle()}
                        password={savedPassword}
                        server={server}
                    />
                ) : (
                    <Stack>
                        <Group wrap="nowrap">
                            <Stack>
                                <Text>
                                    {t('page.manageServers.url', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                                <Text>
                                    {t('page.manageServers.username', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                            </Stack>
                            <Stack>
                                <Text>{server.url}</Text>
                                <Text>{server.username}</Text>
                            </Stack>
                        </Group>
                        <Group grow>
                            <Button
                                leftSection={<RiEdit2Fill />}
                                onClick={() => handleEdit()}
                                tooltip={{
                                    label: t('page.manageServers.editServerDetailsTooltip', {
                                        postProcess: 'sentenceCase',
                                    }),
                                }}
                                variant="subtle"
                            >
                                {t('common.edit')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </ServerSection>
            <Divider my="sm" />
            <TimeoutButton
                leftSection={<RiDeleteBin2Line />}
                timeoutProps={{ callback: handleDeleteServer, duration: 1000 }}
                variant="subtle"
            >
                {t('page.manageServers.removeServer', { postProcess: 'sentenceCase' })}
            </TimeoutButton>
        </Stack>
    );
};
